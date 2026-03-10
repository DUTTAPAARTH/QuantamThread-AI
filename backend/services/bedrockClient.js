/**
 * Bedrock Client – Calls Amazon Bedrock with Meta Llama 3.
 * Uses @aws-sdk/client-bedrock-runtime with AWS Signature V4 auth.
 * Includes a concurrency-limited request queue to avoid throttling.
 */

require("dotenv").config();
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const REGION = process.env.AWS_REGION || "us-east-1";
const MODEL = process.env.BEDROCK_MODEL || "meta.llama3-70b-instruct-v1:0";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const MAX_CONCURRENT = 2;
const INTER_REQUEST_DELAY_MS = 800;

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
  const body = JSON.stringify({
    prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n`,
    max_gen_len: opts.max_gen_len || 1024,
    temperature: 0.7,
    top_p: 0.9,
  });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[BedrockClient] Throttled — retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      await sleep(delay);
    }

    console.log(`[BedrockClient] Calling model: ${MODEL} (attempt ${attempt + 1})`);

    try {
      const command = new InvokeModelCommand({
        modelId: MODEL,
        contentType: "application/json",
        accept: "application/json",
        body,
      });

      const response = await client.send(command);
      const data = JSON.parse(Buffer.from(response.body).toString("utf-8"));
      const generatedText = data.generation || data.output || "No response from model.";
      console.log(`[BedrockClient] Response received (${generatedText.length} chars)`);
      return generatedText.trim();
    } catch (err) {
      const isThrottle = err.name === "ThrottlingException" || err.$metadata?.httpStatusCode === 429;
      if (isThrottle && attempt < MAX_RETRIES) continue;
      console.error(`[BedrockClient] Error: ${err.message}`);
      throw new Error(`Bedrock error: ${err.message}`);
    }
  }
}

module.exports = { callBedrock };
