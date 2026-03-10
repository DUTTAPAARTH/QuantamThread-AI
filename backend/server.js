require("dotenv").config();
const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const { initializeDatabase, dbGet } = require("./db");

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
