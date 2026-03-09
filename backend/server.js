require("dotenv").config();
const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
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
  res.status(500).json({ error: "Internal server error" });
});

// ── Start server after DB is ready ─────────────────────
(async () => {
  try {
    await initializeDatabase();
    console.log("✅ Connect to Database initialized for Lambda");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
})();

module.exports.handler = serverless(app);
