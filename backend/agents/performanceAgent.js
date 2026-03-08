/**
 * Performance Agent – Identifies bottlenecks and optimization opportunities.
 * Supports Global AI mode (context=null) and Project-aware mode.
 * Powered by Amazon Bedrock (Llama 3).
 */

const { callBedrock } = require("../services/bedrockClient");

const SYSTEM_PROMPT =
  "You are a performance optimization expert. Analyze the code or scenario described below for performance " +
  "bottlenecks including N+1 queries, missing caching, synchronous I/O, unoptimized payloads, and event loop blocking. " +
  "Provide specific optimization strategies with code examples where applicable.";

async function analyze(context, userQuery) {
  try {
    let prompt;

    if (!context) {
      prompt = `${SYSTEM_PROMPT}\n\nUser question:\n${userQuery}`;
    } else {
      const history = context.chatHistory
        .slice(-5)
        .map((m) => `${m.agent}: ${m.agent_reply}`)
        .join("\n");
      prompt =
        `${SYSTEM_PROMPT}\n\n` +
        `Project: ${context.project.name}\n` +
        `Description: ${context.project.description || "N/A"}\n` +
        `Recent conversation:\n${history}\n\n` +
        `User question:\n${userQuery}`;
    }

    const reply = await callBedrock(prompt);

    return {
      agent: "performance",
      reply,
      confidence: 0.9,
    };
  } catch (err) {
    console.error("Performance agent Bedrock error:", err.message);
    return {
      agent: "performance",
      reply: `Performance analysis failed: ${err.message}`,
      confidence: 0,
    };
  }
}

module.exports = { analyze };
