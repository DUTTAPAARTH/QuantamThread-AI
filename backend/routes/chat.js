const express = require("express");
const { dbRun, dbAll } = require("../db");
const orchestrator = require("../orchestrator");

const router = express.Router();

// POST /chat – Send a message, run all agents, store & return responses
// projectId is OPTIONAL: omit for Global AI mode, include for Project-aware mode
router.post("/", async (req, res) => {
  const { project_id, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const userMessage = message.trim();
  const projectId = project_id || null; // null = Global AI mode
  const mode = projectId ? "project" : "global";

  try {
    // ── Run agents via orchestrator ──────────────────
    let agentResults;

    if (projectId) {
      // Project-aware mode – orchestrator fetches context from DB
      agentResults = await orchestrator.runAgentsWithContext(projectId, userMessage);
    } else {
      // Global AI mode – no project context
      agentResults = await orchestrator.runAgentsGlobal(userMessage);
    }

    // ── Persist to database ─────────────────────────
    const chatSql = `INSERT INTO chat_history (project_id, agent, user_message, agent_reply) VALUES (?, ?, ?, ?)`;
    const insightSql = `INSERT INTO agent_insights (project_id, agent, summary, confidence) VALUES (?, ?, ?, ?)`;

    await Promise.all(
      agentResults.flatMap((result) => [
        dbRun(chatSql, [projectId, result.agent, userMessage, result.reply]).catch((err) =>
          console.error(`Error saving chat for ${result.agent}:`, err.message)
        ),
        dbRun(insightSql, [
          projectId,
          result.agent,
          `${result.agent} analysis on: "${userMessage.substring(0, 60)}..."`,
          result.confidence,
        ]).catch((err) =>
          console.error(`Error saving insight for ${result.agent}:`, err.message)
        ),
      ])
    );

    // ── Return response ─────────────────────────────
    res.json({
      mode,
      project_id: projectId,
      message: userMessage,
      responses: agentResults,
    });
  } catch (err) {
    console.error("Chat error:", err.message);
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /chat/global – Get global (non-project) chat history
router.get("/global", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM chat_history WHERE project_id IS NULL ORDER BY timestamp ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /chat/:project_id – Get chat history for a project
router.get("/:project_id", async (req, res) => {
  const { project_id } = req.params;
  try {
    const rows = await dbAll(
      `SELECT * FROM chat_history WHERE project_id = ? ORDER BY timestamp ASC`,
      [project_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
