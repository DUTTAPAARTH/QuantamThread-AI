const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

// Use /tmp/ directory for AWS Lambda compatibility (Lambda root is read-only)
const DB_PATH = process.env.AWS_LAMBDA_FUNCTION_VERSION
  ? path.join("/tmp", "quantumthread.db")
  : path.join(__dirname, "quantumthread.db");

// sql.js wrapper that mimics the sqlite3 callback API
let _sqlDb = null;

function getSqlDb() {
  return _sqlDb;
}

// Persist the in-memory DB to disk
function persistDb() {
  if (!_sqlDb) return;
  try {
    const data = _sqlDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error("❌ Failed to persist DB:", e.message);
  }
}

// Load DB from disk into memory (sql.js works in-memory)
async function loadDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _sqlDb = new SQL.Database(fileBuffer);
  } else {
    _sqlDb = new SQL.Database();
  }
  console.log("✅ Connected to SQLite database (sql.js)");
  return _sqlDb;
}

// Compat shim: db.run / db.get / db.all / db.serialize / db.each
const db = {
  run(sql, params, cb) {
    if (typeof params === "function") { cb = params; params = []; }
    try {
      getSqlDb().run(sql, params || []);
      persistDb();
      if (cb) cb.call({ lastID: getSqlDb().exec("SELECT last_insert_rowid()")[0]?.values[0][0] || 0, changes: 1 }, null);
    } catch (err) {
      if (cb) cb(err); else console.error("db.run error:", err.message);
    }
  },
  get(sql, params, cb) {
    if (typeof params === "function") { cb = params; params = []; }
    try {
      const stmt = getSqlDb().prepare(sql);
      stmt.bind(params || []);
      const row = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      if (cb) cb(null, row);
    } catch (err) {
      if (cb) cb(err);
    }
  },
  all(sql, params, cb) {
    if (typeof params === "function") { cb = params; params = []; }
    try {
      const results = getSqlDb().exec(sql, params || []);
      if (!results.length) { if (cb) cb(null, []); return; }
      const { columns, values } = results[0];
      const rows = values.map(v => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
      if (cb) cb(null, rows);
    } catch (err) {
      if (cb) cb(err);
    }
  },
  serialize(fn) { if (fn) fn(); },
  each(sql, params, rowCb, doneCb) {
    this.all(sql, params, (err, rows) => {
      if (err) { if (doneCb) doneCb(err); return; }
      rows.forEach(r => rowCb(null, r));
      if (doneCb) doneCb(null, rows.length);
    });
  },
};

function initializeDatabase() {
  return loadDb().then(() => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          repo_url TEXT,
          source_path TEXT,
          status TEXT DEFAULT 'ready',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migrations for existing tables
      db.run(`ALTER TABLE projects ADD COLUMN repo_url TEXT`, () => { });
      db.run(`ALTER TABLE projects ADD COLUMN source_path TEXT`, () => { });
      db.run(`ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'ready'`, () => { });

      db.run(`
        CREATE TABLE IF NOT EXISTS chat_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          agent TEXT NOT NULL,
          user_message TEXT NOT NULL,
          agent_reply TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS agent_insights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          agent TEXT NOT NULL,
          summary TEXT NOT NULL,
          confidence REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS impact_analysis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          risk TEXT NOT NULL,
          affected_services TEXT NOT NULL,
          affected_teams TEXT NOT NULL,
          confidence REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )
      `);

      // ── Intelligence data tables ──────────────────────
      db.run(`
        CREATE TABLE IF NOT EXISTS modules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          risk_score INTEGER DEFAULT 0,
          risk_level TEXT DEFAULT 'low',
          bug_count INTEGER DEFAULT 0,
          dependency_count INTEGER DEFAULT 0,
          impact_radius INTEGER DEFAULT 0,
          last_modified TEXT,
          bugs TEXT DEFAULT '[]',
          ai_summary TEXT,
          repository TEXT DEFAULT ''
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS vulnerabilities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cve TEXT NOT NULL,
          severity TEXT DEFAULT 'medium',
          exploitability REAL DEFAULT 0,
          affected_versions TEXT,
          library TEXT,
          patch_version TEXT,
          description TEXT,
          affected_modules INTEGER DEFAULT 0,
          dependency_chain TEXT,
          repository TEXT DEFAULT ''
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS dependencies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          module TEXT NOT NULL,
          incoming_count INTEGER DEFAULT 0,
          outgoing_count INTEGER DEFAULT 0,
          gravity INTEGER DEFAULT 0,
          depth INTEGER DEFAULT 0,
          circular_deps INTEGER DEFAULT 0,
          implicit_deps INTEGER DEFAULT 0,
          fan_in INTEGER DEFAULT 0,
          fan_out INTEGER DEFAULT 0,
          volatility REAL DEFAULT 0,
          chain TEXT,
          transitive_exposure INTEGER DEFAULT 0,
          direct_deps TEXT DEFAULT '[]',
          reverse_deps TEXT DEFAULT '[]',
          repository TEXT DEFAULT ''
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS time_periods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT NOT NULL,
          date TEXT,
          risk_score INTEGER DEFAULT 0,
          vulnerability_accumulation INTEGER DEFAULT 0,
          dependency_count INTEGER DEFAULT 0,
          entropy REAL DEFAULT 0,
          modules_changed INTEGER DEFAULT 0,
          commit_count INTEGER DEFAULT 0,
          avg_commit_size REAL DEFAULT 0,
          code_churn INTEGER DEFAULT 0,
          days_to_release INTEGER DEFAULT 0,
          breaking_changes INTEGER DEFAULT 0,
          bugs_fixed INTEGER DEFAULT 0,
          feature_count INTEGER DEFAULT 0,
          repository TEXT DEFAULT ''
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS architecture_nodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          node_id TEXT NOT NULL,
          repository TEXT NOT NULL,
          position_x REAL DEFAULT 0,
          position_y REAL DEFAULT 0,
          label TEXT,
          risk TEXT DEFAULT 'low',
          load INTEGER DEFAULT 0,
          risk_score INTEGER DEFAULT 0
        )
      `);

      db.run(
        `
        CREATE TABLE IF NOT EXISTS architecture_edges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          edge_id TEXT NOT NULL,
          repository TEXT NOT NULL,
          source TEXT NOT NULL,
          target TEXT NOT NULL,
          animated INTEGER DEFAULT 0,
          stroke TEXT DEFAULT '#94a3b8',
          stroke_width REAL DEFAULT 1.5
        )
      `,
        (err) => {
          if (err) {
            console.error("❌ Error creating tables:", err.message);
            reject(err);
          } else {
            console.log("✅ All database tables ready");
            persistDb();
            resolve();
          }
        }
      );
    });
  });
}

// ── Promisified helpers for async orchestrator ──────
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

module.exports = { db, dbGet, dbAll, dbRun, initializeDatabase };
