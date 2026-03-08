const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const AdmZip = require("adm-zip");
const { db, dbRun, dbGet } = require("../db");
const { analyzeProject } = require("../services/projectAnalyzer");

const router = express.Router();

// Upload storage — saves ZIPs to backend/uploads/
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".zip") {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are accepted"));
    }
  },
});

// Extracted projects live here
const PROJECTS_DIR = path.join(__dirname, "..", "projects");
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

// POST /projects/upload – Upload a ZIP file, extract, and analyze
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Send a .zip file as 'file' field." });
    }

    const name = req.body.name || path.basename(req.file.originalname, ".zip");
    const projectDir = path.join(PROJECTS_DIR, `${Date.now()}-${name.replace(/[^a-zA-Z0-9_-]/g, "_")}`);

    // Extract ZIP
    console.log(`📦 Extracting ${req.file.originalname} to ${projectDir}`);
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(projectDir, true);

    // Find the actual root (sometimes ZIPs wrap in a single folder)
    const entries = fs.readdirSync(projectDir);
    let analysisDir = projectDir;
    if (entries.length === 1) {
      const single = path.join(projectDir, entries[0]);
      if (fs.statSync(single).isDirectory()) {
        analysisDir = single;
      }
    }

    // Create project in DB
    const result = await dbRun(
      `INSERT INTO projects (name, repo_url, source_path, status) VALUES (?, ?, ?, ?)`,
      [name.trim(), null, analysisDir, "analyzing"]
    );
    const projectId = result.lastID;

    // Respond immediately — analysis runs in background
    res.status(201).json({
      id: projectId,
      name: name.trim(),
      repo_url: null,
      source_path: analysisDir,
      status: "analyzing",
      created_at: new Date().toISOString(),
    });

    // Clean up uploaded ZIP
    fs.unlink(req.file.path, () => {});

    // Run analysis in background
    analyzeProject(analysisDir, name.trim(), projectId)
      .then((stats) => {
        console.log(`✅ Analysis complete: ${stats.modules} modules from ${stats.files} files`);
        db.run(`UPDATE projects SET status = 'ready' WHERE id = ?`, [projectId]);
      })
      .catch((err) => {
        console.error("❌ Analysis failed:", err.message);
        db.run(`UPDATE projects SET status = 'error' WHERE id = ?`, [projectId]);
      });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /projects/github – Clone from GitHub URL and analyze
router.post("/github", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: "GitHub URL is required" });
    }

    // Validate URL format
    const trimmedUrl = url.trim();
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i;
    if (!githubPattern.test(trimmedUrl)) {
      return res.status(400).json({ error: "Invalid GitHub URL. Use format: https://github.com/user/repo" });
    }

    // Extract repo name from URL
    const repoName = trimmedUrl.split("/").filter(Boolean).pop().replace(/\.git$/, "");
    const projectDir = path.join(PROJECTS_DIR, `${Date.now()}-${repoName}`);

    // Clone the repository
    console.log(`📥 Cloning ${trimmedUrl} to ${projectDir}`);
    try {
      execSync(`git clone --depth 1 "${trimmedUrl}" "${projectDir}"`, {
        timeout: 120000, // 2 minute timeout
        stdio: "pipe",
      });
    } catch (cloneErr) {
      const stderr = cloneErr.stderr?.toString() || cloneErr.message;
      return res.status(400).json({ error: `Git clone failed: ${stderr.slice(0, 200)}` });
    }

    // Create project in DB
    const result = await dbRun(
      `INSERT INTO projects (name, repo_url, source_path, status) VALUES (?, ?, ?, ?)`,
      [repoName, trimmedUrl, projectDir, "analyzing"]
    );
    const projectId = result.lastID;

    // Respond immediately
    res.status(201).json({
      id: projectId,
      name: repoName,
      repo_url: trimmedUrl,
      source_path: projectDir,
      status: "analyzing",
      created_at: new Date().toISOString(),
    });

    // Run analysis in background
    analyzeProject(projectDir, repoName, projectId)
      .then((stats) => {
        console.log(`✅ Analysis complete: ${stats.modules} modules from ${stats.files} files`);
        db.run(`UPDATE projects SET status = 'ready' WHERE id = ?`, [projectId]);
      })
      .catch((err) => {
        console.error("❌ Analysis failed:", err.message);
        db.run(`UPDATE projects SET status = 'error' WHERE id = ?`, [projectId]);
      });

  } catch (err) {
    console.error("GitHub import error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id/status – Check analysis status
router.get("/:id/status", async (req, res) => {
  try {
    const row = await dbGet(`SELECT id, name, status FROM projects WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: "Project not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /projects/:id – Delete a project and all its related data
router.delete("/:id", async (req, res) => {
  const projectId = req.params.id;
  try {
    const project = await dbGet(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const repoName = project.name;

    // Delete intelligence data linked by repository name
    await dbRun(`DELETE FROM modules WHERE repository = ?`, [repoName]);
    await dbRun(`DELETE FROM vulnerabilities WHERE repository = ?`, [repoName]);
    await dbRun(`DELETE FROM dependencies WHERE repository = ?`, [repoName]);
    await dbRun(`DELETE FROM time_periods WHERE repository = ?`, [repoName]);
    await dbRun(`DELETE FROM architecture_nodes WHERE repository = ?`, [repoName]);
    await dbRun(`DELETE FROM architecture_edges WHERE repository = ?`, [repoName]);

    // Delete chat history and impact analysis linked by project_id
    await dbRun(`DELETE FROM chat_history WHERE project_id = ?`, [projectId]);
    await dbRun(`DELETE FROM impact_analysis WHERE project_id = ?`, [projectId]);

    // Delete the project itself
    await dbRun(`DELETE FROM projects WHERE id = ?`, [projectId]);

    // Clean up extracted files on disk
    if (project.source_path && fs.existsSync(project.source_path)) {
      fs.rm(project.source_path, { recursive: true, force: true }, () => {});
    }

    console.log(`\u{1F5D1}\uFE0F  Deleted project: ${repoName} (id=${projectId})`);
    res.json({ success: true, id: Number(projectId), name: repoName });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /projects – List all projects
router.get("/", (req, res) => {
  const sql = `SELECT * FROM projects ORDER BY created_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
