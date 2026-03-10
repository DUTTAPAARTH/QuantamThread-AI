/**
 * Bedrock Client – Calls Amazon Bedrock via the Converse API.
 * Uses @aws-sdk/client-bedrock-runtime with AWS Signature V4 auth.
 * Includes a concurrency-limited request queue to avoid throttling.
 */

require("dotenv").config();
const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");

const REGION = process.env.AWS_REGION || "us-east-1";
const MODEL = process.env.BEDROCK_MODEL || "meta.llama3-70b-instruct-v1:0";

const MAX_RETRIES = 6;
const BASE_DELAY_MS = 5000;
const MAX_CONCURRENT = 1;
const INTER_REQUEST_DELAY_MS = 2000;

const client = new BedrockRuntimeClient({ region: REGION });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Concurrency-limited queue
let activeCount = 0;
const waiting = [];

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      activeCount++;
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      } finally {
        activeCount--;
        await sleep(INTER_REQUEST_DELAY_MS);
        if (waiting.length > 0) waiting.shift()();
      }
    };
    if (activeCount < MAX_CONCURRENT) {
      run();
    } else {
      waiting.push(run);
    }
  });
}

async function callBedrock(prompt, opts = {}) {
  return enqueue(() => _callBedrockInner(prompt, opts));
}

async function _callBedrockInner(prompt, opts = {}) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[BedrockClient] Throttled — retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      await sleep(delay);
    }

    console.log(`[BedrockClient] Calling model: ${MODEL} (attempt ${attempt + 1})`);

    try {
      const command = new ConverseCommand({
        modelId: MODEL,
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: {
          maxTokens: opts.max_gen_len || 1024,
          temperature: 0.7,
          topP: 0.9,
        },
      });

      const response = await client.send(command);
      const generatedText = response.output?.message?.content?.[0]?.text || "No response from model.";
      console.log(`[BedrockClient] Response received (${generatedText.length} chars)`);
      return generatedText.trim();
    } catch (err) {
      const isThrottle =
        err.name === "ThrottlingException" ||
        err.$metadata?.httpStatusCode === 429 ||
        (err.message && err.message.toLowerCase().includes("too many requests"));
      if (isThrottle && attempt < MAX_RETRIES) continue;
      console.error(`[BedrockClient] Error: ${err.message}`);
      throw new Error(`Bedrock error: ${err.message}`);
    }
  }
}

module.exports = { callBedrock };
