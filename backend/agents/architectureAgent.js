/**
 * Architecture Agent – Analyzes system design and architectural patterns.
 * Supports Global AI mode (context=null) and Project-aware mode.
 * Powered by Amazon Bedrock (Llama 3).
 */

const { callBedrock } = require("../services/bedrockClient");

const SYSTEM_PROMPT =
  "You are a senior software architect. Analyze the architecture of the code or system described below. " +
  "Provide concrete recommendations on design patterns, project structure, scalability, and separation of concerns. " +
  "Keep your response clear and actionable.";

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
      agent: "architecture",
      reply,
      confidence: 0.9,
    };
  } catch (err) {
    console.error("Architecture agent Bedrock error:", err.message);
    return {
      agent: "architecture",
      reply: `Architecture analysis failed: ${err.message}`,
      confidence: 0,
    };
  }
}

module.exports = { analyze };
