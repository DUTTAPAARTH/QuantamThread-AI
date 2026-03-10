/**
 * S3 Storage Service — Upload, download, and delete project ZIPs in S3.
 * Falls back gracefully when S3_BUCKET is not configured.
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
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

module.exports = { uploadToS3, downloadFromS3, deleteFromS3, isS3Enabled, s3Key };
