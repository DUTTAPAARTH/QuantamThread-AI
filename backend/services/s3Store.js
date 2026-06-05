const fs = require("fs");
const path = require("path");
const { isS3Enabled, saveJsonToS3, loadJsonFromS3, deleteFromS3, s3Key } = require("./s3Storage");

const LOCAL_DATA_DIR = path.join(__dirname, "..", "projects");

// Ensure local directory exists
if (!fs.existsSync(LOCAL_DATA_DIR)) {
  fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
}

function getLocalPath(...segments) {
  return path.join(LOCAL_DATA_DIR, ...segments);
}

function ensureLocalDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load all projects from manifest.json
 */
async function getProjects() {
  if (isS3Enabled()) {
    const data = await loadJsonFromS3("projects/manifest.json");
    return data || [];
  } else {
    const filePath = getLocalPath("manifest.json");
    if (!fs.existsSync(filePath)) return [];
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) || [];
    } catch (err) {
      console.error("Failed to read local manifest:", err.message);
      return [];
    }
  }
}

/**
 * Save all projects to manifest.json
 */
async function saveProjects(projects) {
  if (isS3Enabled()) {
    await saveJsonToS3("projects/manifest.json", projects);
  } else {
    const filePath = getLocalPath("manifest.json");
    ensureLocalDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(projects, null, 2), "utf-8");
  }
}

/**
 * Get project by ID
 */
async function getProject(id) {
  const projects = await getProjects();
  return projects.find((p) => p.id === Number(id)) || null;
}

/**
 * Create or update a project
 */
async function saveProject(project) {
  const projects = await getProjects();
  let existingIndex = -1;

  if (project.id) {
    existingIndex = projects.findIndex((p) => p.id === Number(project.id));
  }

  if (existingIndex >= 0) {
    // Update existing project
    projects[existingIndex] = {
      ...projects[existingIndex],
      ...project,
      id: Number(project.id) // Ensure ID is a number
    };
    await saveProjects(projects);
    return projects[existingIndex];
  } else {
    // Assign new ID
    const maxId = projects.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newProject = {
      ...project,
      id: maxId + 1,
      created_at: project.created_at || new Date().toISOString()
    };
    projects.push(newProject);
    await saveProjects(projects);
    return newProject;
  }
}

/**
 * Delete project and all its associated data (intelligence, chat, zip)
 */
async function deleteProject(id) {
  const projects = await getProjects();
  const projectToDelete = projects.find((p) => p.id === Number(id));
  if (!projectToDelete) return false;

  // Filter out the project
  const updatedProjects = projects.filter((p) => p.id !== Number(id));
  await saveProjects(updatedProjects);

  const projectId = Number(id);

  if (isS3Enabled()) {
    // Delete intelligence, chat, impact files from S3
    await deleteFromS3(`projects/${projectId}/intelligence.json`);
    await deleteFromS3(`projects/${projectId}/chat.json`);
    await deleteFromS3(`projects/${projectId}/impact.json`);
    if (projectToDelete.s3_key) {
      await deleteFromS3(projectToDelete.s3_key);
    } else {
      await deleteFromS3(s3Key(projectId, projectToDelete.name));
    }
  } else {
    // Delete local directory
    const projectDir = getLocalPath(String(projectId));
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  }

  return true;
}

/**
 * Load intelligence JSON
 */
async function getIntelligence(projectId) {
  if (isS3Enabled()) {
    const data = await loadJsonFromS3(`projects/${projectId}/intelligence.json`);
    return data || null;
  } else {
    const filePath = getLocalPath(String(projectId), "intelligence.json");
    if (!fs.existsSync(filePath)) return null;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) || null;
    } catch (err) {
      console.error(`Failed to read local intelligence for project ${projectId}:`, err.message);
      return null;
    }
  }
}

/**
 * Save intelligence JSON
 */
async function saveIntelligence(projectId, data) {
  if (isS3Enabled()) {
    await saveJsonToS3(`projects/${projectId}/intelligence.json`, data);
  } else {
    const filePath = getLocalPath(String(projectId), "intelligence.json");
    ensureLocalDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

/**
 * Load chat history
 */
async function getChatHistory(projectId) {
  const key = projectId ? `projects/${projectId}/chat.json` : "projects/global_chat.json";
  if (isS3Enabled()) {
    const data = await loadJsonFromS3(key);
    return data || [];
  } else {
    const filePath = projectId
      ? getLocalPath(String(projectId), "chat.json")
      : getLocalPath("global_chat.json");
    if (!fs.existsSync(filePath)) return [];
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) || [];
    } catch (err) {
      console.error(`Failed to read local chat history for project ${projectId || 'global'}:`, err.message);
      return [];
    }
  }
}

/**
 * Save chat history
 */
async function saveChatHistory(projectId, history) {
  const key = projectId ? `projects/${projectId}/chat.json` : "projects/global_chat.json";
  if (isS3Enabled()) {
    await saveJsonToS3(key, history);
  } else {
    const filePath = projectId
      ? getLocalPath(String(projectId), "chat.json")
      : getLocalPath("global_chat.json");
    ensureLocalDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2), "utf-8");
  }
}

/**
 * Load impact analyses
 */
async function getImpactAnalyses(projectId) {
  const key = `projects/${projectId}/impact.json`;
  if (isS3Enabled()) {
    const data = await loadJsonFromS3(key);
    return data || [];
  } else {
    const filePath = getLocalPath(String(projectId), "impact.json");
    if (!fs.existsSync(filePath)) return [];
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) || [];
    } catch (err) {
      console.error(`Failed to read local impact analyses for project ${projectId}:`, err.message);
      return [];
    }
  }
}

/**
 * Save impact analyses
 */
async function saveImpactAnalyses(projectId, analyses) {
  const key = `projects/${projectId}/impact.json`;
  if (isS3Enabled()) {
    await saveJsonToS3(key, analyses);
  } else {
    const filePath = getLocalPath(String(projectId), "impact.json");
    ensureLocalDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(analyses, null, 2), "utf-8");
  }
}

module.exports = {
  getProjects,
  getProject,
  saveProject,
  deleteProject,
  getIntelligence,
  saveIntelligence,
  getChatHistory,
  saveChatHistory,
  getImpactAnalyses,
  saveImpactAnalyses,
};
