const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const https = require("https");
const AdmZip = require("adm-zip");
const { db, dbRun, dbGet } = require("../db");
const { analyzeProject } = require("../services/projectAnalyzer");
const { uploadToS3, downloadFromS3, deleteFromS3, isS3Enabled, s3Key } = require("../services/s3Storage");

const router = express.Router();

// Upload storage — saves ZIPs to /tmp/uploads for AWS Lambda compatibility
const UPLOADS_DIR = process.env.AWS_LAMBDA_FUNCTION_VERSION
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "..", "uploads");
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
const PROJECTS_DIR = process.env.AWS_LAMBDA_FUNCTION_VERSION
  ? path.join("/tmp", "projects")
  : path.join(__dirname, "..", "projects");
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

// Helper: Download file from HTTPS URL with redirect support
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, { timeout: 60000 }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.destroy();
        fs.unlink(destPath, () => {});
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.destroy();
        fs.unlink(destPath, () => {});
        return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
      
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve());
      });
      file.on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on("error", (err) => {
      file.destroy();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

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

    // Upload ZIP to S3 for persistent storage
    let s3ObjKey = null;
    if (isS3Enabled()) {
      try {
        s3ObjKey = await uploadToS3(req.file.path, projectId, name.trim());
        await dbRun(`UPDATE projects SET s3_key = ? WHERE id = ?`, [s3ObjKey, projectId]);
      } catch (s3Err) {
        console.error("⚠️  S3 upload failed (continuing with local):", s3Err.message);
      }
    }

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
    fs.unlink(req.file.path, () => { });

    // Run analysis in background
    analyzeProject(analysisDir, name.trim(), projectId)
      .then((stats) => {
        console.log(`✅ Analysis complete: ${stats.modules} modules from ${stats.files} files`);
        db.run(`UPDATE projects SET status = 'ready' WHERE id = ?`, [projectId]);
        // Clean up local extracted files if stored in S3
        if (s3ObjKey) fs.rm(projectDir, { recursive: true, force: true }, () => {});
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

// POST /projects/github – Download from GitHub (as ZIP) and analyze
router.post("/github", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: "GitHub URL is required" });
    }

    // Validate & parse GitHub URL
    const trimmedUrl = url.trim();
    const match = trimmedUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/i);
    if (!match) {
      return res.status(400).json({ error: "Invalid GitHub URL. Use format: https://github.com/user/repo" });
    }

    const [, owner, repo] = match;
    const repoName = repo;
    const projectDir = path.join(PROJECTS_DIR, `${Date.now()}-${repoName}`);
    const zipPath = path.join(UPLOADS_DIR, `${Date.now()}-${repoName}.zip`);

    // Try to download from main, then master
    let zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
    console.log(`📥 Downloading ${repoName} from ${zipUrl}...`);
    
    try {
      await downloadFile(zipUrl, zipPath);
    } catch (mainErr) {
      console.log(`⚠️  main branch failed, trying master...`);
      zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`;
      try {
        await downloadFile(zipUrl, zipPath);
      } catch (masterErr) {
        return res.status(400).json({ 
          error: `Could not access GitHub repo. Tried main and master branches. ${masterErr.message}` 
        });
      }
    }

    // Extract ZIP
    console.log(`📦 Extracting ${repoName}...`);
    try {
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(projectDir, true);
    } catch (extractErr) {
      fs.unlink(zipPath, () => {});
      return res.status(400).json({ error: `Failed to extract ZIP: ${extractErr.message}` });
    }

    // Find actual root (GitHub wraps in folder)
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
      [repoName, trimmedUrl, analysisDir, "analyzing"]
    );
    const projectId = result.lastID;

    // Upload ZIP to S3 for persistent storage
    let s3ObjKey = null;
    if (isS3Enabled()) {
      try {
        s3ObjKey = await uploadToS3(zipPath, projectId, repoName);
        await dbRun(`UPDATE projects SET s3_key = ? WHERE id = ?`, [s3ObjKey, projectId]);
      } catch (s3Err) {
        console.error("⚠️  S3 upload failed (continuing with local):", s3Err.message);
      }
    }

    // Respond immediately
    res.status(201).json({
      id: projectId,
      name: repoName,
      repo_url: trimmedUrl,
      source_path: analysisDir,
      status: "analyzing",
      created_at: new Date().toISOString(),
    });

    // Clean up ZIP
    fs.unlink(zipPath, () => {});

    // Run analysis in background
    analyzeProject(analysisDir, repoName, projectId)
      .then((stats) => {
        console.log(`✅ Analysis complete: ${stats.modules} modules from ${stats.files} files`);
        db.run(`UPDATE projects SET status = 'ready' WHERE id = ?`, [projectId]);
        // Clean up local extracted files if stored in S3
        if (s3ObjKey) fs.rm(projectDir, { recursive: true, force: true }, () => {});
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

// POST /projects/:id/reanalyze – Re-run analysis on an existing project
router.post("/:id/reanalyze", async (req, res) => {
  try {
    const project = await dbGet(`SELECT * FROM projects WHERE id = ?`, [req.params.id]);
    if (!project) return res.status(404).json({ error: "Project not found" });

    let analysisDir = project.source_path;
    let tempDir = null;

    // If local files are gone but we have S3 backup, restore them
    if ((!analysisDir || !fs.existsSync(analysisDir)) && project.s3_key && isS3Enabled()) {
      tempDir = path.join(PROJECTS_DIR, `reanalyze-${Date.now()}-${project.name}`);
      const tempZip = path.join(UPLOADS_DIR, `reanalyze-${Date.now()}.zip`);
      try {
        await downloadFromS3(project.s3_key, tempZip);
        fs.mkdirSync(tempDir, { recursive: true });
        const zip = new AdmZip(tempZip);
        zip.extractAllTo(tempDir, true);
        fs.unlink(tempZip, () => {});
        // Find actual root
        const entries = fs.readdirSync(tempDir);
        analysisDir = tempDir;
        if (entries.length === 1) {
          const single = path.join(tempDir, entries[0]);
          if (fs.statSync(single).isDirectory()) analysisDir = single;
        }
      } catch (s3Err) {
        if (tempDir && fs.existsSync(tempDir)) fs.rm(tempDir, { recursive: true, force: true }, () => {});
        fs.unlink(tempZip, () => {});
        return res.status(400).json({ error: `Cannot restore project from S3: ${s3Err.message}` });
      }
    } else if (!analysisDir || !fs.existsSync(analysisDir)) {
      return res.status(400).json({ error: "Project source files not found" });
    }

    db.run(`UPDATE projects SET status = 'analyzing' WHERE id = ?`, [project.id]);
    res.json({ id: project.id, name: project.name, status: "analyzing" });

    // Re-run analysis in background
    analyzeProject(analysisDir, project.name, project.id)
      .then((stats) => {
        console.log(`✅ Re-analysis complete: ${stats.modules} modules from ${stats.files} files`);
        db.run(`UPDATE projects SET status = 'ready' WHERE id = ?`, [project.id]);
        // Clean up temp dir if we restored from S3
        if (tempDir) fs.rm(tempDir, { recursive: true, force: true }, () => {});
      })
      .catch((err) => {
        console.error("❌ Re-analysis failed:", err.message);
        db.run(`UPDATE projects SET status = 'error' WHERE id = ?`, [project.id]);
        if (tempDir) fs.rm(tempDir, { recursive: true, force: true }, () => {});
      });
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
      fs.rm(project.source_path, { recursive: true, force: true }, () => { });
    }

    // Delete from S3
    if (project.s3_key && isS3Enabled()) {
      try {
        await deleteFromS3(project.s3_key);
      } catch (s3Err) {
        console.error("⚠️  S3 delete failed:", s3Err.message);
      }
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
