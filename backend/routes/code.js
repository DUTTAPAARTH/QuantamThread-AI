const express = require("express");
const s3Store = require("../services/s3Store");
const { runAgentsGlobal, runAgentsGlobalStream } = require("../orchestrator");
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

    // Store in chat_history via s3Store
    const combinedReply = agents.map((a) => `**[${a.agent}]** ${a.reply}`).join("\n\n");
    try {
      const history = await s3Store.getChatHistory(null);
      const lastId = history.reduce((max, h) => (h.id > max ? h.id : max), 0);
      history.push({
        id: lastId + 1,
        project_id: null,
        agent: "query_assistant",
        user_message: trimmed,
        agent_reply: combinedReply,
        timestamp: new Date().toISOString(),
      });
      await s3Store.saveChatHistory(null, history);
    } catch (saveErr) {
      console.error("Error saving history to s3Store:", saveErr.message);
    }

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
 * POST /code/stream
 * Same as /code/generate but streams each agent result via Server-Sent Events
 * as it completes, so the frontend can display agents one by one (GPT-style).
 */
router.post("/stream", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Heartbeat every 20 s to keep the connection alive on Render free tier
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(": heartbeat\n\n");
  }, 20000);

  try {
    const trimmed = prompt.trim();
    const allResults = [];

    await runAgentsGlobalStream(trimmed, (agentResult) => {
      allResults.push(agentResult);
      res.write(`data: ${JSON.stringify(agentResult)}\n\n`);
    });

    res.write("data: [DONE]\n\n");

    // Persist combined reply to chat history after stream finishes
    const combinedReply = allResults.map((a) => `**[${a.agent}]** ${a.reply}`).join("\n\n");
    try {
      const history = await s3Store.getChatHistory(null);
      const lastId = history.reduce((max, h) => (h.id > max ? h.id : max), 0);
      history.push({
        id: lastId + 1,
        project_id: null,
        agent: "query_assistant",
        user_message: trimmed,
        agent_reply: combinedReply,
        timestamp: new Date().toISOString(),
      });
      await s3Store.saveChatHistory(null, history);
    } catch (saveErr) {
      console.error("Error saving history to s3Store:", saveErr.message);
    }
  } catch (err) {
    console.error("Stream agent error:", err.message);
    if (!res.writableEnded) res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

/**
 * GET /code/history
 * Get past queries.
 */
router.get("/history", async (req, res) => {
  try {
    const history = await s3Store.getChatHistory(null);
    const rows = history
      .filter((h) => h.agent === "query_assistant")
      .map((h) => ({
        id: h.id,
        prompt: h.user_message,
        response: h.agent_reply,
        timestamp: h.timestamp,
      }));
    rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(rows.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
