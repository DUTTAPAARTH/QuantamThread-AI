/**
 * S3 Storage Service — Upload, download, and delete project ZIPs in S3.
 * Falls back gracefully when S3_BUCKET is not configured.
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const fs = require("fs");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.AWS_REGION || "us-east-1";

let s3;
if (BUCKET) {
  s3 = new S3Client({ region: REGION });
  console.log(`☁️  S3 storage enabled → bucket: ${BUCKET}`);
} else {
  console.log("⚠️  S3_BUCKET not set — projects stored locally only");
}

function s3Key(projectId, name) {
  return `projects/${projectId}/${name}.zip`;
}

/**
 * Upload a ZIP file to S3.
 * @param {string} filePath - Local path to the ZIP file
 * @param {number} projectId
 * @param {string} name - Project name
 * @returns {string|null} S3 key, or null if S3 not configured
 */
async function uploadToS3(filePath, projectId, name) {
  if (!s3) return null;
  const key = s3Key(projectId, name);
  const body = fs.createReadStream(filePath);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: "application/zip",
  }));
  console.log(`☁️  Uploaded to S3: ${key}`);
  return key;
}

/**
 * Download a project ZIP from S3 to a local path.
 * @param {string} key - S3 object key
 * @param {string} destPath - Local file path to write to
 */
async function downloadFromS3(key, destPath) {
  if (!s3) throw new Error("S3 not configured");
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const writeStream = fs.createWriteStream(destPath);
  await pipeline(Readable.from(res.Body), writeStream);
  console.log(`☁️  Downloaded from S3: ${key} → ${destPath}`);
}

/**
 * Delete a project ZIP from S3.
 * @param {string} key - S3 object key
 */
async function deleteFromS3(key) {
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  console.log(`☁️  Deleted from S3: ${key}`);
}

function isS3Enabled() {
  return !!s3;
}


/**
 * List all projects stored in S3.
 * Parses keys in format: projects/{id}/{name}.zip
 * @returns {Promise<Array>} Array of { id, name, s3Key }
 */
async function listProjectsFromS3() {
  if (!s3) return [];
  const projects = [];
  let continuationToken = undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "projects/",
      ContinuationToken: continuationToken,
    }));
    for (const obj of (res.Contents || [])) {
      const match = obj.Key.match(/^projects\/(\d+)\/(.+)\.zip$/);
      if (match) {
        projects.push({ id: parseInt(match[1]), name: match[2], s3Key: obj.Key });
      }
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);
  return projects;
}


/**
 * Save intelligence analysis results as JSON to S3.
 * Key: projects/{id}/intelligence.json
 */
async function saveIntelligenceToS3(projectId, data) {
  if (!s3) return;
  const key = `projects/${projectId}/intelligence.json`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  }));
  console.log(`☁️  Saved intelligence to S3: ${key}`);
}

/**
 * Load intelligence analysis results from S3.
 * Returns null if not found.
 */
async function loadIntelligenceFromS3(projectId) {
  if (!s3) return null;
  const key = `projects/${projectId}/intelligence.json`;
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

module.exports = { uploadToS3, downloadFromS3, deleteFromS3, isS3Enabled, s3Key, listProjectsFromS3, saveIntelligenceToS3, loadIntelligenceFromS3 };
