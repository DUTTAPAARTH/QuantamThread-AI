/**
 * Seed script — REMOVED.
 * Scripted seed data has been removed. Intelligence data now comes
 * from real AI agent analysis via Amazon Bedrock (Llama 3).
 */

async function seed() {
  console.log("ℹ️  Seed script disabled — using real AI analysis.");
}

module.exports = { seed };

if (require.main === module) {
  seed().then(() => process.exit(0));
}
