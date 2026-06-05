const express = require("express");
const s3Store = require("../services/s3Store");
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
  const projectId = project_id ? Number(project_id) : null; // null = Global AI mode
  const mode = projectId ? "project" : "global";

  try {
    // ── Run agents via orchestrator ──────────────────
    let agentResults;

    if (projectId) {
      // Project-aware mode – orchestrator fetches context from S3/local store
      agentResults = await orchestrator.runAgentsWithContext(projectId, userMessage);
    } else {
      // Global AI mode – no project context
      agentResults = await orchestrator.runAgentsGlobal(userMessage);
    }

    // ── Persist to store ─────────────────────────────
    try {
      const history = await s3Store.getChatHistory(projectId);
      const timestamp = new Date().toISOString();
      let lastId = history.reduce((max, h) => (h.id > max ? h.id : max), 0);

      for (const result of agentResults) {
        lastId++;
        history.push({
          id: lastId,
          project_id: projectId,
          agent: result.agent,
          user_message: userMessage,
          agent_reply: result.reply,
          timestamp,
        });
      }
      await s3Store.saveChatHistory(projectId, history);
    } catch (saveErr) {
      console.error("Error saving chat history to s3Store:", saveErr.message);
    }

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
    const history = await s3Store.getChatHistory(null);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /chat/:project_id – Get chat history for a project
router.get("/:project_id", async (req, res) => {
  const { project_id } = req.params;
  try {
    const history = await s3Store.getChatHistory(Number(project_id));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
