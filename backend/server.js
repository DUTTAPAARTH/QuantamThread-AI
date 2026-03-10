require("dotenv").config();
const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const { initializeDatabase, dbGet, dbRun, dbAll } = require("./db");
const { isS3Enabled, listProjectsFromS3 } = require("./services/s3Storage");

const projectsRouter = require("./routes/projects");
const chatRouter = require("./routes/chat");
const impactRouter = require("./routes/impact");
const intelligenceRouter = require("./routes/intelligence");
const codeRouter = require("./routes/code");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Serve frontend for local dev (start.bat) ───────────
const path = require("path");
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (!process.env.AWS_LAMBDA_FUNCTION_VERSION && !process.env.RENDER) {
  const fs = require("fs");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
  }
}

// ── Root (API deployments only — local static serving handles / above) ──
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "QuantumThread AI API is running." });
});
// ── Health check ───────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "QuantumThread AI Backend",
    timestamp: new Date().toISOString(),
    agents: [
      "architecture",
      "bug_detection",
      "security",
      "performance",
      "tutor",
    ],
  });
});


// ── S3 debug (temporary) ───────────────────────────────
app.get("/debug/s3", async (req, res) => {
  try {
    const { isS3Enabled, listProjectsFromS3 } = require("./services/s3Storage");
    const { dbAll } = require("./db");
    const s3Enabled = isS3Enabled();
    const s3Projects = s3Enabled ? await listProjectsFromS3() : [];
    const dbProjects = await dbAll("SELECT id, name, s3_key, status FROM projects");
    res.json({ s3Enabled, s3Bucket: process.env.S3_BUCKET || null, s3Projects, dbProjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── API Routes ─────────────────────────────────────────
app.use("/projects", projectsRouter);
app.use("/chat", chatRouter);
app.use("/impact", impactRouter);
app.use("/intelligence", intelligenceRouter);
app.use("/code", codeRouter);

// ── SPA fallback for local dev ─────────────────────────
if (!process.env.AWS_LAMBDA_FUNCTION_VERSION && !process.env.RENDER) {
  const fs = require("fs");
  const indexPath = path.join(frontendDist, "index.html");
  if (fs.existsSync(indexPath)) {
    app.get("{*splat}", (req, res) => {
      res.sendFile(indexPath);
    });
  }
}

// ── Catch-all 404 handler ──────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ error: `API Route ${req.method} ${req.path} not found` });
});

// ── Error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});


// On Render, SQLite is wiped on every restart. Re-register any projects found in S3.
async function restoreProjectsFromS3() {
  if (!isS3Enabled()) return;
  try {
    const s3Projects = await listProjectsFromS3();
    if (s3Projects.length === 0) return;
    let restored = 0;
    for (const p of s3Projects) {
      const existing = await dbGet(`SELECT id FROM projects WHERE id = ?`, [p.id]);
      if (!existing) {
        await dbRun(
          `INSERT INTO projects (id, name, s3_key, status, created_at) VALUES (?, ?, ?, ?, ?)`,
          [p.id, p.name, p.s3Key, "ready", new Date().toISOString()]
        );
        restored++;
        console.log(`☁️  Restored from S3: ${p.name} (id=${p.id})`);
      }
    }
    // Keep sqlite_sequence in sync so new project IDs don't collide
    if (restored > 0) {
      await dbRun(`UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM projects) WHERE name = 'projects'`).catch(() => {});
      console.log(`☁️  S3 restore complete — ${restored} project(s) re-registered`);
    }
  } catch (err) {
    console.error("⚠️  S3 project restore failed:", err.message);
  }
}
// ── Start server after DB is ready ─────────────────────
if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  // Lambda: initialize DB on cold start, no listener needed
  (async () => {
    try {
      await initializeDatabase();
      console.log("✅ Database initialized for Lambda");
    } catch (err) {
      console.error("Failed to initialize database:", err);
    }
  })();
} else {
  // Render / local dev: initialize DB then start Express listener
  initializeDatabase()
    .then(() => {
      restoreProjectsFromS3().catch((err) => console.error('S3 restore error:', err.message));
      app.listen(PORT, () => {
        console.log(`\n🚀 QuantumThread AI Backend running on http://localhost:${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/health\n`);
      });
    })
    .catch((err) => {
      console.error("Failed to initialize database:", err);
      process.exit(1);
    });
}

// Export for AWS Lambda / Amplify
module.exports.handler = serverless(app);
module.exports = app;
