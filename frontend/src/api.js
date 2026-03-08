/**
 * QuantumThread AI — API Client
 * Connects to the Express backend at localhost:3001
 */

const API_BASE = "https://35ot86lr2m.execute-api.us-east-1.amazonaws.com";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Intelligence endpoints ─────────────────────────────
export const fetchModules = (repo) =>
  request(`/intelligence/modules?repo=${encodeURIComponent(repo)}`);

export const fetchVulnerabilities = (repo) =>
  request(`/intelligence/vulnerabilities?repo=${encodeURIComponent(repo)}`);

export const fetchDependencies = (repo) =>
  request(`/intelligence/dependencies?repo=${encodeURIComponent(repo)}`);

export const fetchEvolution = (repo) =>
  request(`/intelligence/evolution?repo=${encodeURIComponent(repo)}`);

export const fetchArchitecture = (repo) =>
  request(`/intelligence/architecture?repo=${encodeURIComponent(repo)}`);

export const fetchSummary = (repo) =>
  request(`/intelligence/summary?repo=${encodeURIComponent(repo)}`);

// ── Project endpoints ──────────────────────────────────
export const fetchProjects = () => request("/projects");

export const uploadProject = async (file, name) => {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);
  const res = await fetch("/projects/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (HTTP ${res.status})`);
  }
  return res.json();
};

export const importGithub = (url) =>
  request("/projects/github", { method: "POST", body: JSON.stringify({ url }) });

export const fetchProjectStatus = (id) => request(`/projects/${id}/status`);

export const deleteProject = (id) =>
  request(`/projects/${id}`, { method: "DELETE" });

// ── Chat endpoints ─────────────────────────────────────
export const sendChat = (message, projectId = null) => {
  const body = { message };
  if (projectId) body.project_id = projectId;
  return request("/chat", { method: "POST", body: JSON.stringify(body) });
};
export const fetchGlobalChat = () => request("/chat/global");
export const fetchProjectChat = (projectId) => request(`/chat/${projectId}`);

// ── Impact endpoints ───────────────────────────────────
export const createImpact = (data) =>
  request("/impact", { method: "POST", body: JSON.stringify(data) });
export const fetchImpact = (projectId) => request(`/impact/${projectId}`);

// ── AI Query Console ───────────────────────────────────
export const queryAgents = (prompt) =>
  request("/code/generate", { method: "POST", body: JSON.stringify({ prompt }) });
export const fetchQueryHistory = () => request("/code/history");

// ── Health ─────────────────────────────────────────────
export const fetchHealth = () => request("/health");
