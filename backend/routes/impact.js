const express = require("express");
const { db } = require("../db");

const router = express.Router();

// POST /impact – Create an impact analysis entry
router.post("/", (req, res) => {
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

  // Verify the project exists
  db.get(`SELECT id FROM projects WHERE id = ?`, [project_id], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!project) {
      return res.status(404).json({ error: `Project with id ${project_id} not found` });
    }

    const sql = `INSERT INTO impact_analysis (project_id, risk, affected_services, affected_teams, confidence) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [project_id, risk.trim(), services, teams, conf], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        project_id,
        risk: risk.trim(),
        affected_services: services,
        affected_teams: teams,
        confidence: conf,
        created_at: new Date().toISOString(),
      });
    });
  });
});

// GET /impact/:project_id – Get all impact analyses for a project
router.get("/:project_id", (req, res) => {
  const { project_id } = req.params;
  const sql = `SELECT * FROM impact_analysis WHERE project_id = ? ORDER BY created_at DESC`;
  db.all(sql, [project_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
