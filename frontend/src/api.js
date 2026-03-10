/**
 * QuantumThread AI — API Client
 * Backend: https://quantamthread-ai-2.onrender.com (Render)
 */

// Hardcoded correct backend URL — do NOT use env vars to avoid Amplify misconfiguration.
const API_BASE = "https://quantamthread-ai-2.onrender.com";

console.log("[QuantumThread] API_BASE:", API_BASE);

async function request(path, options = {}, _retries = 3) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s hard timeout
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    clearTimeout(timeout);
    // Retry on network errors — Render free tier cold starts take ~15-30s
    // 3 retries x 12s = 36s total wait time
    if (_retries > 0 && (err instanceof TypeError || err.name === "AbortError")) {
      await new Promise((r) => setTimeout(r, 12000));
      return request(path, options, _retries - 1);
    }
    throw err;
  }
}

// — Intelligence endpoints ——————————————————————————————
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

// — Project endpoints ——————————————————————————————————
export const fetchProjects = () => request("/projects");

export const uploadProject = async (file, name) => {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);
  const res = await fetch(`${API_BASE}/projects/upload`, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (HTTP ${res.status})`);
  }
  return res.json();
};

export const importGithub = (url) =>
  request("/projects/github", {
    method: "POST",
    body: JSON.stringify({ url })
  });

export const fetchProjectStatus = (id) => request(`/projects/${id}/status`);

export const reanalyzeProject = (id) =>
  request(`/projects/${id}/reanalyze`, { method: "POST" });

export const deleteProject = (id) =>
  request(`/projects/${id}`, { method: "DELETE" });

// — Chat endpoints —————————————————————————————————————
export const sendChat = (message, projectId = null) => {
  const body = { message };
  if (projectId) body.project_id = projectId;
  return request("/chat", { method: "POST", body: JSON.stringify(body) });
};
export const fetchGlobalChat = () => request("/chat/global");
export const fetchProjectChat = (projectId) => request(`/chat/${projectId}`);

// — Impact endpoints ————————————————————————————————————
export const createImpact = (data) =>
  request("/impact", { method: "POST", body: JSON.stringify(data) });
export const fetchImpact = (projectId) => request(`/impact/${projectId}`);

// — AI Query Console ————————————————————————————————————
export const queryAgents = (prompt) =>
  request("/code/generate", { method: "POST", body: JSON.stringify({ prompt }) });
export const fetchQueryHistory = () => request("/code/history");

// — Health —————————————————————————————————————————————
export const fetchHealth = () => request("/health");