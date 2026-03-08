/**
 * Security Agent – Scans for vulnerabilities and security risks.
 * Supports Global AI mode (context=null) and Project-aware mode.
 * Powered by Amazon Bedrock (Llama 3).
 */

const { callBedrock } = require("../services/bedrockClient");

const SYSTEM_PROMPT =
  "You are a cybersecurity expert. Analyze the code or scenario described below for security vulnerabilities " +
  "including SQL injection, XSS, authentication flaws, sensitive data exposure, and insecure configurations. " +
  "Provide specific remediation steps with code examples where applicable.";

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
      agent: "security",
      reply,
      confidence: 0.9,
    };
  } catch (err) {
    console.error("Security agent Bedrock error:", err.message);
    return {
      agent: "security",
      reply: `Security analysis failed: ${err.message}`,
      confidence: 0,
    };
  }
}

module.exports = { analyze };
