/**
 * Bedrock Client – Calls Amazon Bedrock with Meta Llama 3.
 * Exports callBedrock(prompt) for all agents.
 * Includes a concurrency-limited request queue to avoid 429 rate limits.
 */

require("dotenv").config();
const fetch = require("node-fetch");

const API_KEY = process.env.BEDROCK_API_KEY;
const REGION = process.env.AWS_REGION || "us-east-1";
const MODEL = process.env.BEDROCK_MODEL || "meta.llama3-70b-instruct-v1:0";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;
const MAX_CONCURRENT = 2; // Allow 2 requests in flight at a time
const INTER_REQUEST_DELAY_MS = 800;

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

/**
 * Send a prompt to Amazon Bedrock (Llama 3) and return the generated text.
 * Requests go through a concurrency-limited queue (max 2 in flight).
 * Retries automatically on 429 (rate limit) with exponential backoff.
 * @param {string} prompt - The user prompt
 * @param {object} [opts] - Optional overrides { max_gen_len }
 * @returns {Promise<string>} The model's generated text
 */
async function callBedrock(prompt, opts = {}) {
  return enqueue(() => _callBedrockInner(prompt, opts));
}

async function _callBedrockInner(prompt, opts = {}) {
  const url = `https://bedrock-runtime.${REGION}.amazonaws.com/model/${encodeURIComponent(MODEL)}/invoke`;

  const body = JSON.stringify({
    prompt: `User: ${prompt}\nAssistant:`,
    max_gen_len: opts.max_gen_len || 1024,
    temperature: 0.7,
    top_p: 0.9,
  });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[BedrockClient] Rate limited — retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      await sleep(delay);
    }

    console.log(`[BedrockClient] Calling model: ${MODEL} (attempt ${attempt + 1})`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body,
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BedrockClient] API error ${response.status}: ${errorText}`);
      throw new Error(`Bedrock API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.generation || data.output || "No response from model.";

    console.log(`[BedrockClient] Response received (${generatedText.length} chars)`);
    return generatedText.trim();
  }
}

module.exports = { callBedrock };