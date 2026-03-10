require("dotenv").config();
const express = require("express");
const cors = require("cors");
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
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.amplifyapp\.com$/.test(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));

// ── Root ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "QuantumThread AI Backend" });
});

// ── Health check ───────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "QuantumThread AI Backend",
    timestamp: new Date().toISOString(),
    agents: ["architecture", "bug_detection", "security", "performance", "tutor"],
  });
});

// ── Routes ─────────────────────────────────────────────
app.use("/projects", projectsRouter);
app.use("/chat", chatRouter);
app.use("/impact", impactRouter);
app.use("/intelligence", intelligenceRouter);
app.use("/code", codeRouter);

// ── Catch-all 404 handler for API routes ───────────────
app.use((req, res, next) => {
  res.status(404).json({ error: `API Route ${req.method} ${req.path} not found` });
});

// ── Error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ── Restore projects from S3 into SQLite on every boot ─
// Render free tier wipes the filesystem on restart, so SQLite is empty each time.
// This scans S3 and re-inserts any missing project rows.
async function restoreProjectsFromS3() {
  if (!isS3Enabled()) {
    console.log("S3 not enabled — skipping project restore");
    return;
  }
  try {
    const s3Projects = await listProjectsFromS3();
    console.log(`☁️  Found ${s3Projects.length} project(s) in S3`);
    let restored = 0;
    for (const p of s3Projects) {
      const existing = await dbGet("SELECT id FROM projects WHERE id = ?", [p.id]);
      if (!existing) {
        await dbRun(
          "INSERT INTO projects (id, name, s3_key, status, created_at) VALUES (?, ?, ?, ?, ?)",
          [p.id, p.name, p.s3Key, "ready", new Date().toISOString()]
        );
        restored++;
        console.log(`☁️  Restored: ${p.name} (id=${p.id})`);
      }
    }
    if (restored > 0) {
      await dbRun(
        "UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM projects) WHERE name = 'projects'"
      ).catch(() => {});
      console.log(`☁️  Restored ${restored} project(s) from S3`);
    } else {
      console.log("☁️  All S3 projects already in DB");
    }
  } catch (err) {
    console.error("⚠️  S3 project restore failed:", err.message);
  }
}

// ── Start server ───────────────────────────────────────
(async () => {
  try {
    await initializeDatabase();
    console.log("✅ Database initialized");
    await restoreProjectsFromS3();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
})();