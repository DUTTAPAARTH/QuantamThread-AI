/**
 * Tutor Agent – Provides educational explanations, code examples, and guidance.
 * Supports Global AI mode (context=null) and Project-aware mode.
 * Powered by Amazon Bedrock (Llama 3).
 */

const { callBedrock } = require("../services/bedrockClient");

const SYSTEM_PROMPT =
  "You are a patient and knowledgeable programming tutor. Explain the concept or code described below " +
  "in a clear, educational manner with practical code examples. " +
  "Adapt your explanation to the learner's apparent level and provide actionable takeaways.";

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
      agent: "tutor",
      reply,
      confidence: 0.9,
    };
  } catch (err) {
    console.error("Tutor agent Bedrock error:", err.message);
    return {
      agent: "tutor",
      reply: `Tutor explanation failed: ${err.message}`,
      confidence: 0,
    };
  }
}

module.exports = { analyze };
