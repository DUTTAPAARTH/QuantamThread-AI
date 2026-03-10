/**
 * QuantumThread AI – Central Orchestrator
 *
 * Coordinates all five AI agents and aggregates their responses.
 * Supports two modes:
 *   - Global AI mode (ChatGPT-style, no project context)
 *   - Project-aware mode (with project data + chat history)
 */

const { dbGet, dbAll } = require("./db");

const architectureAgent = require("./agents/architectureAgent");
const bugAgent = require("./agents/bugAgent");
const securityAgent = require("./agents/securityAgent");
const performanceAgent = require("./agents/performanceAgent");
const tutorAgent = require("./agents/tutorAgent");

const agents = [
  { name: "architecture", module: architectureAgent },
  { name: "bug_detection", module: bugAgent },
  { name: "security", module: securityAgent },
  { name: "performance", module: performanceAgent },
  { name: "tutor", module: tutorAgent },
];

/**
 * Run all agents in Global AI mode (no project context).
 * Behaves like a general-purpose ChatGPT-style assistant.
 *
 * @param {string} userQuery - The user's input message
 * @returns {Promise<Array>} Array of agent response objects
 */
async function runAgentsGlobal(userQuery) {
  console.log(`🧠 Orchestrator [GLOBAL MODE]: dispatching to ${agents.length} agents...`);

  const results = await Promise.all(
    agents.map(async ({ name, module }) => {
      try {
        const result = await module.analyze(null, userQuery);
        console.log(`  ✔ ${name} agent responded (confidence: ${result.confidence})`);
        return result;
      } catch (err) {
        console.error(`  ✖ ${name} agent failed:`, err.message);
        return {
          agent: name,
          reply: `Agent "${name}" encountered an error: ${err.message}`,
          confidence: 0,
        };
      }
    })
  );

  console.log(`🧠 Orchestrator [GLOBAL MODE]: all agents complete`);
  return results;
}

/**
 * Run all agents in Project-aware mode.
 * Fetches project data + recent chat history from SQLite and passes as context.
 *
 * @param {number} projectId - The project ID
 * @param {string} userQuery - The user's input message
 * @returns {Promise<Array>} Array of agent response objects
 */
async function runAgentsWithContext(projectId, userQuery) {
  console.log(`🧠 Orchestrator [PROJECT MODE, id=${projectId}]: building context...`);

  // Fetch project info and recent chat history in parallel
  const [project, chatHistory] = await Promise.all([
    dbGet(`SELECT * FROM projects WHERE id = ?`, [projectId]),
    dbAll(
      `SELECT agent, user_message, agent_reply, timestamp
       FROM chat_history
       WHERE project_id = ?
       ORDER BY timestamp DESC
       LIMIT 20`,
      [projectId]
    ),
  ]);

  if (!project) {
    throw new Error(`Project with id ${projectId} not found`);
  }

  const context = {
    project,
    chatHistory: chatHistory.reverse(), // chronological order
  };

  console.log(
    `  📋 Context: project="${project.name}", history=${context.chatHistory.length} msgs`
  );
  console.log(`🧠 Orchestrator [PROJECT MODE]: dispatching to ${agents.length} agents...`);

  const results = await Promise.all(
    agents.map(async ({ name, module }) => {
      try {
        const result = await module.analyze(context, userQuery);
        console.log(`  ✔ ${name} agent responded (confidence: ${result.confidence})`);
        return result;
      } catch (err) {
        console.error(`  ✖ ${name} agent failed:`, err.message);
        return {
          agent: name,
          reply: `Agent "${name}" encountered an error: ${err.message}`,
          confidence: 0,
        };
      }
    })
  );

  console.log(`🧠 Orchestrator [PROJECT MODE]: all agents complete`);
  return results;
}

/**
 * Run all agents in Global AI mode, calling onAgent(result) as each one completes.
 * Agents queue through the Bedrock client (MAX_CONCURRENT=1) so they arrive one by one.
 *
 * @param {string} userQuery
 * @param {function} onAgent - called with { agent, reply, confidence } for each agent
 */
async function runAgentsGlobalStream(userQuery, onAgent) {
  console.log(`🧠 Orchestrator [STREAM MODE]: dispatching to ${agents.length} agents...`);

  await Promise.all(
    agents.map(({ name, module }) =>
      module.analyze(null, userQuery)
        .then((result) => {
          console.log(`  ✔ ${name} agent responded (confidence: ${result.confidence})`);
          onAgent({ agent: result.agent, reply: result.reply, confidence: result.confidence });
        })
        .catch((err) => {
          console.error(`  ✖ ${name} agent failed:`, err.message);
          onAgent({ agent: name, reply: `Agent "${name}" encountered an error: ${err.message}`, confidence: 0 });
        })
    )
  );

  console.log(`🧠 Orchestrator [STREAM MODE]: all agents complete`);
}

module.exports = {
  runAgentsGlobal,
  runAgentsGlobalStream,
  runAgentsWithContext,
  agentNames: agents.map((a) => a.name),
};
