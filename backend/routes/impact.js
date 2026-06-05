const express = require("express");
const s3Store = require("../services/s3Store");

const router = express.Router();

// POST /impact – Create an impact analysis entry
router.post("/", async (req, res) => {
  const { project_id, risk, affected_services, affected_teams, confidence } = req.body;

  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }
  if (!risk || !risk.trim()) {
    return res.status(400).json({ error: "risk is required" });
  }

  const services = Array.isArray(affected_services)
    ? affected_services.join(", ")
    : affected_services || "";
  const teams = Array.isArray(affected_teams)
    ? affected_teams.join(", ")
    : affected_teams || "";
  const conf = typeof confidence === "number" ? confidence : 0.5;

  try {
    // Verify the project exists in s3Store
    const project = await s3Store.getProject(project_id);
    if (!project) {
      return res.status(404).json({ error: `Project with id ${project_id} not found` });
    }

    const analyses = await s3Store.getImpactAnalyses(project_id);
    const lastId = analyses.reduce((max, a) => (a.id > max ? a.id : max), 0);

    const newAnalysis = {
      id: lastId + 1,
      project_id: Number(project_id),
      risk: risk.trim(),
      affected_services: services,
      affected_teams: teams,
      confidence: conf,
      created_at: new Date().toISOString(),
    };

    analyses.push(newAnalysis);
    await s3Store.saveImpactAnalyses(project_id, analyses);

    res.status(201).json(newAnalysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /impact/:project_id – Get all impact analyses for a project
router.get("/:project_id", async (req, res) => {
  const { project_id } = req.params;
  try {
    const analyses = await s3Store.getImpactAnalyses(project_id);
    analyses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
