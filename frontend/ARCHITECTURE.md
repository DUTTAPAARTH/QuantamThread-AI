# QuantumThread AI — Architecture Overview

> A compiler-native engineering intelligence console for real-time codebase analysis, risk assessment, AI code generation, and architectural visualization.

---

## System Overview

QuantumThread AI is a full-stack application with a **single-port architecture**. The Express backend serves both the REST API and the built frontend on port 3001.

| Layer | Stack | Port |
|-------|-------|------|
| **Frontend** | React 19.2.0, Vite 6.3.5, React Router 7.13.1 (HashRouter), Zustand 5.0.11, TailwindCSS 3.4.17, Framer Motion 11.18.2, ReactFlow 11.11.4 | `3001` (served by backend) |
| **Backend** | Express 5.2.1, SQLite3 5.1.7, Multi-Agent Orchestrator (5 agents + Code Agent) | `3001` |

Data flows unidirectionally: **Backend (SQLite → Express API) → Frontend (API Client → Zustand Store → React Pages)**.

---

## Component Tree

```
<HashRouter>
  <Router>
    <Routes>
      <Route path="/" element={<Layout />}>
        ├── <Route index               element={<Dashboard />} />
        ├── <Route path="architecture"  element={<ArchitectureMap />} />
        ├── <Route path="bug-risk"      element={<BugRisk />} />
        ├── <Route path="security"      element={<SecurityScanner />} />
        ├── <Route path="dependencies"  element={<DependencyIntelligence />} />
        ├── <Route path="evolution"     element={<RepositoryEvolution />} />
        └── <Route path="code-assistant" element={<CodeAssistant />} />
      </Route>
    </Routes>
  </Router>
</HashRouter>
```

### Layout Component

`Layout.jsx` (293 lines) is the shell that wraps all 7 pages and provides:

- **Sidebar Navigation** — 7 nav items with Material Symbols icons (including Code Assistant), active-state highlighting via `useLocation()`
- **Header Bar** — Repository selector dropdown (Quantum-Core, Payment-Service), Branch selector (main, staging, feature-auth), Global search input, Confidence score badge, User profile
- **Outlet** — Renders child page via React Router's `<Outlet />`, passing `selectedRepository`, `selectedBranch`, and `repoConfig` as outlet context

### Repository Configurations

Two demo repositories are hardcoded in `Layout.jsx`:

| Repository | Full Name | Files | Risk Modules | Security Issues | Bottlenecks |
|------------|-----------|-------|--------------|-----------------|-------------|
| Quantum-Core | quantum-core-v2 | 12,842 | 14 | 5 | 28 |
| Payment-Service | payment-service-api | 8,420 | 22 | 8 | 42 |

Confidence score formula: `max(0, 100 - riskModules×2 - securityIssues×3.5 - floor(bottlenecks/2))`

---

## Folder Structure

### Frontend (`frontend/`)

```
frontend/
├── index.html                  # Entry HTML (loads Google Material Symbols)
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite dev server, proxy routes → :3001, @ alias
├── tailwind.config.js          # Extended colors, shadows, font-family
├── postcss.config.js           # Tailwind + Autoprefixer
├── eslint.config.js            # ESLint 9 flat config
│
└── src/
    ├── main.jsx                # React 19 entry: StrictMode + HashRouter
    ├── Router.jsx              # Route definitions (7 pages under Layout)
    ├── api.js                  # REST client — relative paths (no base URL)
    ├── index.css               # CSS variables, constraint enforcement, base styles
    ├── globals.css             # Global tokens, resets, component defaults
    ├── App.css                 # Keyframe animations, ReactFlow overrides, scrollbar styling
    │
    ├── components/
    │   └── Layout.jsx          # Shell: sidebar (7 nav items) + header + outlet
    │
    ├── pages/
    │   ├── Dashboard.jsx              # Overview with Sparklines, ArcGauges, metrics
    │   ├── ArchitectureMap.jsx        # ReactFlow graph with custom nodes
    │   ├── BugRisk.jsx                # Bug analysis with entropy calculation
    │   ├── SecurityScanner.jsx        # Vulnerability scanner, CVSS scoring
    │   ├── DependencyIntelligence.jsx # Dependency graph, hub detection, simulation
    │   ├── RepositoryEvolution.jsx    # Time-series analysis, volatility index
    │   └── CodeAssistant.jsx          # AI code generation with agent insights
    │
    └── store/
        └── intelligence.store.js  # Zustand store — centralized state + API fetching
```

### Backend (`backend/`)

```
backend/
├── server.js                   # Express 5 entry — serves API + built frontend on port 3001
├── db.js                       # SQLite3 connection, schema initialization (10 tables)
├── orchestrator.js             # Multi-agent coordinator (global + project-aware modes)
├── seed-intelligence.js        # Data seeder — auto-runs on first start
├── package.json                # Backend dependencies
│
├── agents/
│   ├── architectureAgent.js    # Architecture analysis agent
│   ├── bugAgent.js             # Bug detection agent
│   ├── securityAgent.js        # Security vulnerability agent
│   ├── performanceAgent.js     # Performance bottleneck agent
│   ├── tutorAgent.js           # Educational/tutor agent
│   └── codeAgent.js            # Code generation agent (8+ templates)
│
└── routes/
    ├── intelligence.js         # /intelligence/* — modules, vulns, deps, evolution, architecture
    ├── projects.js             # /projects — CRUD for project management
    ├── chat.js                 # /chat — AI chat with multi-agent orchestration
    ├── impact.js               # /impact — Impact analysis storage
    └── code.js                 # /code/* — Code generation, history, templates
```

---

## Data Flow Architecture

### 1. API Client Layer (`api.js`)

All HTTP communication is centralized in a single module using relative paths (`API_BASE = ""`):

```
Intelligence Endpoints:
  GET /intelligence/modules?repo=         → fetchModules(repo)
  GET /intelligence/vulnerabilities?repo= → fetchVulnerabilities(repo)
  GET /intelligence/dependencies?repo=    → fetchDependencies(repo)
  GET /intelligence/evolution?repo=       → fetchEvolution(repo)
  GET /intelligence/architecture?repo=    → fetchArchitecture(repo)
  GET /intelligence/summary?repo=         → fetchSummary(repo)

Project Endpoints:
  GET  /projects         → fetchProjects()
  POST /projects         → createProject(name)

Chat Endpoints:
  POST /chat             → sendChat(message, projectId?)
  GET  /chat/global      → fetchGlobalChat()
  GET  /chat/:projectId  → fetchProjectChat(projectId)

Impact Endpoints:
  POST /impact           → createImpact(data)
  GET  /impact/:id       → fetchImpact(projectId)

Code Generation Endpoints:
  POST /code/generate    → generateCode(prompt)
  GET  /code/history     → fetchCodeHistory()
  GET  /code/templates   → fetchCodeTemplates()

Health:
  GET  /health           → fetchHealth()
```

### 2. State Management Layer (`intelligence.store.js`)

Zustand store (208 lines) with three concerns:

| Section | Fields |
|---------|--------|
| **Data** | `modules[]`, `vulnerabilities[]`, `dependencies[]`, `timePeriods[]`, `architecture{nodes,edges}`, `summary` |
| **Loading** | `loading`, `error`, `initialized` |
| **UI State** | `selectedRepository`, `selectedBranch`, `selectedVersion` |

**Key pattern:** `fetchAll(repo)` triggers parallel `Promise.all()` across all 6 intelligence API endpoints. Individual fetchers (`fetchModulesData`, etc.) allow granular updates.

**Memoized Selectors:**
- `getModuleById(id)` — Direct lookup
- `calculateEntropy()` — Shannon entropy of bug distribution
- `calculateGravity(moduleId)` — Risk score + cascade effect
- `getSecurityScore()` — Weighted vulnerability score (critical×30, high×15, medium×8)
- `getHubModules()` — Modules with connectivity above 70% of max
- `getRiskTrend()` — Delta between first and last time period risk scores

### 3. Page Data Consumption Pattern

Every page follows the same initialization pattern:

```javascript
const storeData = useIntelligenceStore((state) => state.dataSlice);
const fetchData = useIntelligenceStore((state) => state.fetchDataSlice);
const initialized = useIntelligenceStore((state) => state.initialized);

useEffect(() => {
  if (!initialized) {
    useIntelligenceStore.getState().fetchAll();
  } else if (storeData.length === 0) {
    fetchData();
  }
}, [initialized, storeData.length, fetchData]);
```

This ensures: (1) first visit triggers full hydration, (2) subsequent visits only fetch missing slices.

---

## Backend Architecture

### Single-Port Serving

`server.js` uses `express.static()` to serve the built frontend from `frontend/dist/`. An SPA fallback middleware serves `index.html` for any non-API request, making `HashRouter` work correctly. The database auto-seeds intelligence data on first run when the modules table is empty.

### Database Schema (SQLite3)

10 tables initialized in `db.js`:

| Table | Purpose |
|-------|---------|
| `projects` | Project management (id, name, created_at) |
| `chat_history` | Agent chat logs (project_id, agent, user_message, agent_reply) |
| `agent_insights` | Stored analysis results per agent |
| `impact_analysis` | Impact assessment records (risk, affected_services, affected_teams) |
| `modules` | Code modules with risk scores, bug counts, AI summaries |
| `vulnerabilities` | Security vulnerabilities with CVSS-like scoring |
| `dependencies` | Module dependency graph (in/out degree, depth, circular refs) |
| `time_periods` | Historical evolution data (versions, risk, entropy, churn) |
| `architecture_nodes` | Graph node positions and risk levels |
| `architecture_edges` | Graph edge connections with animation/styling |

### Multi-Agent Orchestrator

`orchestrator.js` coordinates 5 AI analysis agents:

1. **Architecture Agent** — Codebase structure analysis
2. **Bug Detection Agent** — Bug pattern identification
3. **Security Agent** — Vulnerability detection
4. **Performance Agent** — Bottleneck analysis
5. **Tutor Agent** — Educational explanations

Two execution modes:
- **Global Mode** (`runAgentsGlobal`) — Stateless ChatGPT-style analysis
- **Project-Aware Mode** (`runAgentsWithContext`) — Context-enriched with project data + chat history

All agents run in parallel via `Promise.all()` and return `{ agent, reply, confidence }`.

### Code Agent

`codeAgent.js` is a standalone 6th agent (not part of the orchestrator) that generates code from natural language prompts. It supports 8+ templates:

| Template | Language |
|----------|----------|
| REST API | JavaScript/Node.js |
| React Component | JSX |
| JWT Auth Middleware | JavaScript |
| SQLite CRUD | JavaScript |
| Python FastAPI | Python |
| WebSocket Server | JavaScript |
| Jest Test Suite | JavaScript |
| Tailwind CSS Component | HTML/CSS |

The `/code/generate` route calls both the Code Agent and all 5 orchestrator agents, returning generated code alongside agent insights.

---

## Key Architectural Patterns

### Compiler-Native Design Enforcement

The design system is enforced via CSS:

1. **CSS Level** — `index.css` and `globals.css` use `!important` overrides to forbid box-shadows, enforce max border-radius (6px), and constrain animation properties
2. **Tailwind Config** — Extended color palette, font families, and shadow definitions in `tailwind.config.js`

### Vite Configuration

- Dev server on port `5173` (development only)
- Proxy: `/intelligence`, `/projects`, `/chat`, `/impact`, `/health` → `http://localhost:3001`
- Path alias: `@` → `/src`
- Plugin: `@vitejs/plugin-react`
- Base: `./` (relative paths for production build)
- Build output: `frontend/dist/`

---

## Page Feature Summary

| Page | Key Features |
|------|-------------|
| **Dashboard** | Sparkline bar charts, SVG arc gauges, metrics grid, activity feed, quick-nav cards |
| **ArchitectureMap** | Interactive ReactFlow graph, custom DepthBadge nodes, MiniMap, node inspector panel |
| **BugRisk** | Shannon entropy calculation, cascade sort, module risk table, bug inspector |
| **SecurityScanner** | CVSS-weighted scoring, vulnerability table, patch coverage, exploitability analysis |
| **DependencyIntelligence** | Hub detection, gravity model, transitive exposure, failure simulation mode |
| **RepositoryEvolution** | Volatility index, time-series timeline, coupling analysis, quadrant view |
| **CodeAssistant** | ChatGPT-style prompt UI, 8 quick-pick templates, 5-agent insight panel, code copy |

---

## CSS Architecture

Three CSS files compose the styling layer:

| File | Purpose | Lines |
|------|---------|-------|
| `index.css` | CSS custom properties, Tailwind directives, constraint enforcement | 176 |
| `globals.css` | Global design tokens, component defaults, spacing/animation enforcement | ~268 |
| `App.css` | Keyframe animations, ReactFlow overrides, scrollbar customization | 145 |

Import order in `main.jsx`: `index.css` → `globals.css` → `App.css`

The constraint enforcement cascade ensures that even if component-level Tailwind classes attempt to use forbidden properties (box-shadow, large border-radius, transforms), the global rules override them with `!important`.
