/**
 * QuantumThread AI – Central Orchestrator
 *
 * Coordinates all five AI agents and aggregates their responses.
 * Supports two modes:
 *   - Global AI mode (ChatGPT-style, no project context)
 *   - Project-aware mode (with project data + chat history)
 */

const s3Store = require("./services/s3Store");

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
 * Fetches project data + recent chat history and passes as context.
 *
 * @param {number} projectId - The project ID
 * @param {string} userQuery - The user's input message
 * @returns {Promise<Array>} Array of agent response objects
 */
async function runAgentsWithContext(projectId, userQuery) {
  console.log(`🧠 Orchestrator [PROJECT MODE, id=${projectId}]: building context...`);

  const project = await s3Store.getProject(projectId);
  if (!project) {
    throw new Error(`Project with id ${projectId} not found`);
  }

  const chatHistory = await s3Store.getChatHistory(projectId);
  // Sort chatHistory by timestamp desc, limit to 20, reverse for context (chronological)
  const sortedChat = [...chatHistory]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)
    .reverse();

  const context = {
    project,
    chatHistory: sortedChat,
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
