const express = require("express");
const { dbRun, dbAll } = require("../db");
const { runAgentsGlobal } = require("../orchestrator");

const router = express.Router();

/**
 * POST /code/generate
 * Run all 5 AI agents on any user query — code, questions, anything.
 * Body: { prompt: string }
 * Returns: { agents: [{ agent, reply, confidence }], timestamp }
 */
router.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const trimmed = prompt.trim();

    // Run all 5 agents on the query
    const agentResults = await runAgentsGlobal(trimmed);

    const agents = agentResults.map((r) => ({
      agent: r.agent,
      reply: r.reply,
      confidence: r.confidence,
    }));

    // Store in chat_history
    const combinedReply = agents.map((a) => `**[${a.agent}]** ${a.reply}`).join("\n\n");
    await dbRun(
      `INSERT INTO chat_history (project_id, agent, user_message, agent_reply) VALUES (?, ?, ?, ?)`,
      [null, "query_assistant", trimmed, combinedReply]
    ).catch((err) => console.error("Error saving history:", err.message));

    res.json({
      agents,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Agent query error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /code/history
 * Get past queries.
 */
router.get("/history", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT id, user_message as prompt, agent_reply as response, timestamp
       FROM chat_history
       WHERE agent = 'query_assistant'
       ORDER BY timestamp DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
