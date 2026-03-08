/**
 * Project Analyzer — Scans uploaded project files and populates
 * intelligence DB tables using AI agents.
 */

const fs = require("fs");
const path = require("path");
const { dbRun, dbAll } = require("../db");
const { callBedrock } = require("./bedrockClient");

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs",
  ".c", ".cpp", ".h", ".hpp", ".cs", ".rb", ".php", ".swift",
  ".kt", ".scala", ".vue", ".svelte", ".html", ".css", ".scss",
  ".json", ".yaml", ".yml", ".toml", ".xml", ".sql", ".sh", ".bat",
  ".md", ".txt", ".env.example", ".gitignore", ".dockerfile",
]);

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "__pycache__",
  ".venv", "venv", "target", "bin", "obj", ".idea", ".vscode",
  "coverage", ".cache", ".turbo",
]);

/**
 * Walk directory and collect source files.
 */
function collectFiles(dir, baseDir = dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectFiles(fullPath, baseDir));
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (CODE_EXTENSIONS.has(ext) || entry.name === "Dockerfile" || entry.name === "Makefile") {
          const relativePath = path.relative(baseDir, fullPath);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size < 200000) { // skip files > 200KB
              const content = fs.readFileSync(fullPath, "utf-8");
              results.push({ path: relativePath, ext, content, size: stat.size });
            }
          } catch { /* skip unreadable */ }
        }
      }
    }
  } catch { /* skip unreadable */ }
  return results;
}

/**
 * Group files into logical modules (by top-level folder).
 */
function groupIntoModules(files) {
  const modules = {};
  for (const file of files) {
    const parts = file.path.split(/[\\/]/);
    const moduleName = parts.length > 1 ? parts[0] : "(root)";
    if (!modules[moduleName]) modules[moduleName] = [];
    modules[moduleName].push(file);
  }
  return modules;
}

/**
 * Analyze a project directory and populate the DB.
 * @param {string} projectDir - Path to the extracted project folder
 * @param {string} projectName - Name to use as repository key
 * @param {number} projectId - DB project ID
 */
async function analyzeProject(projectDir, projectName, projectId) {
  console.log(`\n📊 [Analyzer] Starting analysis of "${projectName}" from ${projectDir}`);

  const files = collectFiles(projectDir);
  console.log(`📊 [Analyzer] Found ${files.length} source files`);

  if (files.length === 0) {
    console.log("📊 [Analyzer] No source files found — nothing to analyze");
    return { modules: 0, files: 0 };
  }

  const moduleGroups = groupIntoModules(files);
  const moduleNames = Object.keys(moduleGroups);
  console.log(`📊 [Analyzer] Detected ${moduleNames.length} modules: ${moduleNames.join(", ")}`);

  // Clear existing data for this project/repo
  await dbRun("DELETE FROM modules WHERE repository = ?", [projectName]);
  await dbRun("DELETE FROM vulnerabilities WHERE repository = ?", [projectName]);
  await dbRun("DELETE FROM dependencies WHERE repository = ?", [projectName]);
  await dbRun("DELETE FROM architecture_nodes WHERE repository = ?", [projectName]);
  await dbRun("DELETE FROM architecture_edges WHERE repository = ?", [projectName]);
  await dbRun("DELETE FROM time_periods WHERE repository = ?", [projectName]);

  // Build a file summary for the AI prompt (keep it compact)
  const fileSummary = files
    .slice(0, 40) // limit to 40 files for prompt size
    .map((f) => `${f.path} (${f.size}B)`)
    .join("\n");

  // Build code snippets for analysis (first 50 lines of key files)
  const keyFiles = files
    .filter((f) => [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go"].includes(f.ext))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  const codeSnippets = keyFiles
    .map((f) => {
      const lines = f.content.split("\n").slice(0, 50).join("\n");
      return `--- ${f.path} ---\n${lines}`;
    })
    .join("\n\n");

  // ── Run all 3 AI analyses in parallel ─────────────────
  console.log("📊 [Analyzer] Running AI analyses (modules + security + deps) in parallel...");

  const modulePrompt = `Analyze this project. Return ONLY a JSON array of modules.
Files: ${fileSummary}
Code: ${codeSnippets.slice(0, 4000)}
Each element: {"name":"module","risk_score":0-100,"risk_level":"low|medium|high","bug_count":0,"dependency_count":0,"impact_radius":0,"ai_summary":"summary"}`;

  const secPrompt = `Security scan this code. Return ONLY a JSON array.
Code: ${codeSnippets.slice(0, 3500)}
Each element: {"cve":"QT-YYYY-NNNN","severity":"critical|high|medium|low","exploitability":0.0-1.0,"library":"lib","description":"issue","affected_modules":0}
If none found, return [].`;

  const depPrompt = `Identify module dependencies. Return ONLY a JSON array.
Structure: ${fileSummary.slice(0, 2000)}
Code: ${codeSnippets.slice(0, 2500)}
Each element: {"module":"name","incoming_count":0,"outgoing_count":0,"gravity":0,"depth":0,"circular_deps":0,"volatility":0.0,"direct_deps":["dep"],"reverse_deps":["dep"]}`;

  const genOpts = { max_gen_len: 768 };
  const [moduleResult, secResult, depResult] = await Promise.allSettled([
    callBedrock(modulePrompt, genOpts),
    callBedrock(secPrompt, genOpts),
    callBedrock(depPrompt, genOpts),
  ]);

  // ── Process modules result ────────────────────────────
  if (moduleResult.status === "fulfilled") {
    try {
      const moduleData = parseJsonFromAI(moduleResult.value);
      if (Array.isArray(moduleData) && moduleData.length > 0) {
        for (const m of moduleData) {
          await dbRun(
            `INSERT INTO modules (name, risk_score, risk_level, bug_count, dependency_count, impact_radius, last_modified, bugs, ai_summary, repository)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              m.name || "unknown",
              clamp(m.risk_score, 0, 100),
              m.risk_level || "low",
              m.bug_count || 0,
              m.dependency_count || 0,
              m.impact_radius || 0,
              new Date().toISOString(),
              JSON.stringify(m.bugs || []),
              m.ai_summary || "",
              projectName,
            ]
          );
        }
        console.log(`📊 [Analyzer] Inserted ${moduleData.length} modules`);
      }
    } catch (err) {
      console.error("📊 [Analyzer] Module parse failed:", err.message);
    }
  } else {
    console.error("📊 [Analyzer] Module analysis failed:", moduleResult.reason?.message);
  }

  // Fallback: insert basic modules from directory structure if none inserted
  const existingModules = await dbAll("SELECT COUNT(*) as cnt FROM modules WHERE repository = ?", [projectName]);
  if (existingModules[0].cnt === 0) {
    for (const [modName, modFiles] of Object.entries(moduleGroups)) {
      await dbRun(
        `INSERT INTO modules (name, risk_score, risk_level, bug_count, dependency_count, impact_radius, last_modified, bugs, ai_summary, repository)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [modName, 0, "low", 0, modFiles.length, 0, new Date().toISOString(), "[]", `${modFiles.length} files`, projectName]
      );
    }
  }

  // ── Process security result ───────────────────────────
  if (secResult.status === "fulfilled") {
    try {
      const secData = parseJsonFromAI(secResult.value);
      if (Array.isArray(secData)) {
        for (const v of secData) {
          await dbRun(
            `INSERT INTO vulnerabilities (cve, severity, exploitability, affected_versions, library, patch_version, description, affected_modules, dependency_chain, repository)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              v.cve || `QT-${Date.now()}`,
              v.severity || "medium",
              Math.min(1, Math.max(0, v.exploitability || 0)),
              v.affected_versions || "",
              v.library || "",
              v.patch_version || "",
              v.description || "",
              v.affected_modules || 0,
              v.dependency_chain || "",
              projectName,
            ]
          );
        }
        console.log(`📊 [Analyzer] Inserted ${secData.length} vulnerabilities`);
      }
    } catch (err) {
      console.error("📊 [Analyzer] Security parse failed:", err.message);
    }
  } else {
    console.error("📊 [Analyzer] Security analysis failed:", secResult.reason?.message);
  }

  // ── Process dependencies result ───────────────────────
  if (depResult.status === "fulfilled") {
    try {
      const depData = parseJsonFromAI(depResult.value);
      if (Array.isArray(depData)) {
        for (const d of depData) {
          await dbRun(
            `INSERT INTO dependencies (module, incoming_count, outgoing_count, gravity, depth, circular_deps, implicit_deps, fan_in, fan_out, volatility, chain, transitive_exposure, direct_deps, reverse_deps, repository)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              d.module || "unknown",
              d.incoming_count || 0,
              d.outgoing_count || 0,
              d.gravity || 0,
              d.depth || 0,
              d.circular_deps || 0,
              d.implicit_deps || 0,
              d.incoming_count || 0,
              d.outgoing_count || 0,
              d.volatility || 0,
              "",
              0,
              JSON.stringify(d.direct_deps || []),
              JSON.stringify(d.reverse_deps || []),
              projectName,
            ]
          );
        }
        console.log(`📊 [Analyzer] Inserted ${depData.length} dependencies`);
      }
    } catch (err) {
      console.error("📊 [Analyzer] Dependency parse failed:", err.message);
    }
  } else {
    console.error("📊 [Analyzer] Dependency analysis failed:", depResult.reason?.message);
  }

  // ── Architecture nodes/edges ──────────────────────────
  console.log("📊 [Analyzer] Building architecture map...");
  const moduleList = await dbAll("SELECT * FROM modules WHERE repository = ?", [projectName]);
  const spacing = 250;
  const cols = Math.ceil(Math.sqrt(moduleList.length));
  for (let i = 0; i < moduleList.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const riskLevel = moduleList[i].risk_level || "low";
    await dbRun(
      `INSERT INTO architecture_nodes (node_id, repository, position_x, position_y, label, risk, load, risk_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `node-${i}`,
        projectName,
        col * spacing + 100,
        row * spacing + 100,
        moduleList[i].name,
        riskLevel,
        moduleList[i].bug_count || 0,
        moduleList[i].risk_score || 0,
      ]
    );
  }

  // Create edges from dependency data
  const depList = await dbAll("SELECT * FROM dependencies WHERE repository = ?", [projectName]);
  let edgeIdx = 0;
  for (const dep of depList) {
    const directDeps = JSON.parse(dep.direct_deps || "[]");
    const sourceNode = moduleList.findIndex((m) => m.name === dep.module);
    for (const target of directDeps) {
      const targetNode = moduleList.findIndex((m) => m.name === target);
      if (sourceNode >= 0 && targetNode >= 0) {
        await dbRun(
          `INSERT INTO architecture_edges (edge_id, repository, source, target, animated, stroke, stroke_width) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `edge-${edgeIdx++}`,
            projectName,
            `node-${sourceNode}`,
            `node-${targetNode}`,
            0,
            "#94a3b8",
            1.5,
          ]
        );
      }
    }
  }

  console.log(`📊 [Analyzer] Architecture: ${moduleList.length} nodes, ${edgeIdx} edges`);
  console.log(`📊 [Analyzer] ✅ Analysis complete for "${projectName}"\n`);

  return { modules: moduleList.length, files: files.length };
}

/**
 * Try to extract a JSON array from an AI response that may contain markdown/text.
 */
function parseJsonFromAI(text) {
  // Try direct parse first
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch { /* continue */ }

  // Try to find JSON array in the response
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch { /* continue */ }
  }

  // Try to find JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const obj = JSON.parse(objMatch[0]);
      return Array.isArray(obj) ? obj : [obj];
    } catch { /* continue */ }
  }

  console.warn("[Analyzer] Could not parse AI response as JSON:", text.slice(0, 200));
  return [];
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, Number(val) || 0));
}

module.exports = { analyzeProject, collectFiles };
