/**
 * AI Client – Powered by AWS Bedrock Runtime calling Amazon Nova Lite.
 */

require("dotenv").config();
const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");

const REGION = process.env.AWS_REGION || "us-east-1";
const BEDROCK_MODEL = process.env.BEDROCK_MODEL || "arn:aws:bedrock:us-east-1:857294630609:inference-profile/us.amazon.nova-lite-v1:0";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// Use Bedrock credentials from environment (prefer BEDROCK-specific variables)
const accessKeyId = process.env.BEDROCK_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.BEDROCK_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const config = { region: REGION };
if (accessKeyId && secretAccessKey) {
  config.credentials = { accessKeyId, secretAccessKey };
}
const bedrockClient = new BedrockRuntimeClient(config);

// Check if we are using a Bedrock API Key (either via BEDROCK_API_KEY starting with ABSK,
// or via accessKeyId starting with 'BedrockAPIKey-')
let abskToken = process.env.BEDROCK_API_KEY;
if (abskToken && !abskToken.startsWith("ABSK")) {
  abskToken = null;
}
if (!abskToken && accessKeyId && accessKeyId.startsWith("BedrockAPIKey-") && secretAccessKey) {
  abskToken = "ABSK" + Buffer.from(`${accessKeyId}:${secretAccessKey}`).toString("base64");
}

if (abskToken) {
  console.log(`☁️  AI Engine: AWS Bedrock (model: ${BEDROCK_MODEL}, region: ${REGION}) using API Key`);
  bedrockClient.middlewareStack.add(
    (next, context) => async (args) => {
      delete args.request.headers["authorization"];
      delete args.request.headers["Authorization"];
      args.request.headers["Authorization"] = `Bearer ${abskToken}`;
      return next(args);
    },
    {
      step: "finalizeRequest",
      name: "bearerTokenMiddleware",
      priority: "high"
    }
  );
} else {
  console.log(`☁️  AI Engine: AWS Bedrock (model: ${BEDROCK_MODEL}, region: ${REGION}) using IAM SigV4`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main function — drop-in replacement for callBedrock().
 * Accepts a prompt string and optional opts { max_gen_len }.
 */
async function callBedrock(prompt, opts = {}) {
  const maxTokens = opts.max_gen_len || 1024;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[AI Client] Rate limited — retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      await sleep(delay);
    }

    console.log(`[BedrockClient] Calling ${BEDROCK_MODEL} (attempt ${attempt + 1})`);

    try {
      const commandParams = {
        modelId: BEDROCK_MODEL,
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: {
          maxTokens: maxTokens,
          temperature: 0.7,
          topP: 0.9,
        },
        performanceConfig: { latency: "standard" },
      };

      const command = new ConverseCommand(commandParams);
      const response = await bedrockClient.send(command);
      const text = response.output?.message?.content?.[0]?.text || "No response from Bedrock.";
      console.log(`[BedrockClient] Response received (${text.length} chars)`);
      return text.trim();
    } catch (err) {
      const isRateLimit =
        err.status === 429 ||
        err.name === "RateLimitError" ||
        err.name === "ThrottlingException" ||
        (err.message && err.message.toLowerCase().includes("rate limit")) ||
        (err.message && err.message.toLowerCase().includes("too many requests"));

      if (isRateLimit && attempt < MAX_RETRIES) continue;

      console.error(`[AI Client] Error: ${err.message}`);
      throw new Error(`AI client error: ${err.message}`);
    }
  }
}

module.exports = { callBedrock };
