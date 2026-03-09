/**
 * One-time migration: ZIP existing local projects, upload to S3, update DB, delete local folders.
 * Run: node migrate-projects-to-s3.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { initializeDatabase, db, dbRun, dbAll } = require("./db");
const { uploadToS3, isS3Enabled } = require("./services/s3Storage");

const PROJECTS_DIR = path.join(__dirname, "projects");
const TEMP_DIR = path.join(__dirname, "uploads");

async function migrate() {
  await initializeDatabase();

  if (!isS3Enabled()) {
    console.error("❌ S3_BUCKET not configured. Set it in .env first.");
    process.exit(1);
  }

  const projects = await dbAll(`SELECT id, name, source_path, s3_key FROM projects WHERE s3_key IS NULL`);
  if (projects.length === 0) {
    console.log("✅ No projects to migrate — all already in S3.");
    process.exit(0);
  }

  console.log(`📦 Found ${projects.length} projects to migrate to S3:\n`);

  for (const project of projects) {
    const { id, name, source_path } = project;
    console.log(`── Project #${id}: ${name}`);

    // Find the top-level project folder (parent of source_path)
    // source_path is like .../projects/1772925132626-RentaMoto-main/RentaMoto-main
    // We want to zip the parent folder: .../projects/1772925132626-RentaMoto-main
    let folderToZip = source_path;
    if (source_path && fs.existsSync(source_path)) {
      const parent = path.dirname(source_path);
      // If parent is still inside PROJECTS_DIR, zip from parent
      if (parent.startsWith(PROJECTS_DIR) && parent !== PROJECTS_DIR) {
        folderToZip = parent;
      }
    } else {
      console.log(`   ⚠️  Source path not found: ${source_path} — skipping`);
      continue;
    }

    // Create ZIP
    const zipName = `${id}-${name}.zip`;
    const zipPath = path.join(TEMP_DIR, zipName);
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    console.log(`   📦 Zipping ${folderToZip}...`);
    const zip = new AdmZip();
    zip.addLocalFolder(folderToZip);
    zip.writeZip(zipPath);
    const zipSize = fs.statSync(zipPath).size;
    console.log(`   📦 ZIP created: ${(zipSize / 1024 / 1024).toFixed(2)} MB`);

    // Upload to S3
    try {
      console.log(`   ☁️  Uploading to S3...`);
      const s3Key = await uploadToS3(zipPath, id, name);
      console.log(`   ☁️  Uploaded: ${s3Key}`);

      // Update DB
      await dbRun(`UPDATE projects SET s3_key = ? WHERE id = ?`, [s3Key, id]);
      console.log(`   ✅ DB updated with s3_key`);

      // Delete local ZIP
      fs.unlinkSync(zipPath);

      // Delete local project folder
      console.log(`   🗑️  Deleting local folder: ${folderToZip}`);
      fs.rmSync(folderToZip, { recursive: true, force: true });
      console.log(`   ✅ Done\n`);
    } catch (err) {
      console.error(`   ❌ S3 upload failed: ${err.message}\n`);
      // Clean up temp zip
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    }
  }

  // Clean up empty projects dir
  try {
    const remaining = fs.readdirSync(PROJECTS_DIR);
    if (remaining.length === 0) {
      fs.rmdirSync(PROJECTS_DIR);
      console.log("🗑️  Deleted empty projects/ folder");
    } else {
      console.log(`⚠️  projects/ folder still has ${remaining.length} item(s) — not deleting`);
    }
  } catch {}

  console.log("\n✅ Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
