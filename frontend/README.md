# QuantumThread AI

An engineering intelligence console for real-time codebase analysis, risk assessment, security scanning, dependency mapping, architectural visualization, and AI-powered code generation. Built with a compiler-native design aesthetic.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2.0 |
| Build Tool | Vite | 6.3.5 |
| Routing | React Router (HashRouter) | 7.13.1 |
| State Management | Zustand | 5.0.11 |
| Styling | TailwindCSS | 3.4.17 |
| Animation | Framer Motion | 11.18.2 |
| Graph Visualization | ReactFlow | 11.11.4 |
| Icons | Material Symbols, Lucide React | — |
| Backend | Express | 5.2.1 |
| Database | SQLite3 | 5.1.7 |

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (ships with Node.js)

---

## Quick Start

### Option A — One-Click Launch (Windows)

Double-click **`start.bat`** in the project root. It will:
1. Install backend dependencies (if needed)
2. Start the Express server on port 3001
3. Wait for the health check to pass
4. Open `http://localhost:3001` in the default browser

> The database auto-seeds on first run — no manual seeding required.

### Option B — Manual Launch

```bash
# 1. Install & build frontend
cd frontend
npm install --legacy-peer-deps
npx vite build          # outputs to frontend/dist/

# 2. Install & start backend
cd ../backend
npm install
npm start               # serves API + built frontend on port 3001
```

Open **http://localhost:3001** in your browser.

### Development Mode

For live-reload during frontend development:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend dev server (proxies API to :3001)
cd frontend && npm run dev
```

The Vite dev server runs on **http://localhost:5173** and proxies API routes to the backend.

---

## Project Structure

```
quantumthread/
├── start.bat                  # One-click launcher (Windows)
├── backend/
│   ├── server.js              # Express entry — serves API + built frontend (port 3001)
│   ├── db.js                  # SQLite3 connection & schema (10 tables)
│   ├── orchestrator.js        # Multi-agent coordinator (5 agents)
│   ├── seed-intelligence.js   # Demo data seeder (auto-runs on first start)
│   ├── agents/                # 6 AI agents
│   │   ├── architectureAgent.js
│   │   ├── bugAgent.js
│   │   ├── securityAgent.js
│   │   ├── performanceAgent.js
│   │   ├── tutorAgent.js
│   │   └── codeAgent.js       # Code generation (8+ templates)
│   └── routes/                # API route handlers
│       ├── intelligence.js    # /intelligence/* endpoints
│       ├── projects.js        # /projects CRUD
│       ├── chat.js            # /chat multi-agent chat
│       ├── impact.js          # /impact analysis
│       └── code.js            # /code/* generation & history
│
└── frontend/
    ├── src/
    │   ├── main.jsx           # React entry (HashRouter)
    │   ├── Router.jsx         # 7 route definitions
    │   ├── api.js             # REST API client (relative paths)
    │   ├── index.css          # CSS tokens + constraints
    │   ├── globals.css        # Global styles + resets
    │   ├── App.css            # Animations + overrides
    │   ├── components/
    │   │   └── Layout.jsx     # Shell: sidebar (7 nav items) + header
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── ArchitectureMap.jsx
    │   │   ├── BugRisk.jsx
    │   │   ├── SecurityScanner.jsx
    │   │   ├── DependencyIntelligence.jsx
    │   │   ├── RepositoryEvolution.jsx
    │   │   └── CodeAssistant.jsx
    │   └── store/
    │       └── intelligence.store.js
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Overview with KPI metrics, sparklines, arc gauges, and quick-nav |
| **Architecture Map** | `/architecture` | Interactive ReactFlow node-edge graph with depth badges and inspector |
| **Bug & Risk Analysis** | `/bug-risk` | Module risk table with Shannon entropy, cascade sorting, and AI summaries |
| **Security Scanner** | `/security` | Vulnerability table with CVSS-weighted scoring and patch coverage |
| **Dependency Intelligence** | `/dependencies` | Hub detection, gravity model, transitive exposure, failure simulation |
| **Repository Evolution** | `/evolution` | Time-series analysis with volatility index, coupling, and quadrant view |
| **Code Assistant** | `/code-assistant` | AI code generation with 8+ templates and 5-agent insight integration |

---

## API Endpoints

### Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/intelligence/modules?repo=` | All modules with risk scores |
| GET | `/intelligence/modules/:id` | Single module detail |
| GET | `/intelligence/vulnerabilities?repo=` | All vulnerabilities |
| GET | `/intelligence/dependencies?repo=` | Dependency graph data |
| GET | `/intelligence/evolution?repo=` | Time period history |
| GET | `/intelligence/architecture?repo=` | Architecture nodes & edges |
| GET | `/intelligence/summary?repo=` | Aggregated summary |

### Projects & Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| POST | `/projects` | Create a project |
| POST | `/chat` | Send message to AI agents |
| GET | `/chat/global` | Global chat history |
| GET | `/chat/:projectId` | Project chat history |

### Code Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/code/generate` | Generate code from prompt + run 5 agents |
| GET | `/code/history` | Last 50 code generations |
| GET | `/code/templates` | Available template categories |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/impact` | Create impact analysis |
| GET | `/impact/:projectId` | Get impact analysis |
| GET | `/health` | Service health check |

---

## Available Scripts

### Frontend

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start Vite dev server on port 5173 |
| Build | `npm run build` | Production build to `dist/` |
| Preview | `npm run preview` | Preview production build |
| Lint | `npm run lint` | Run ESLint |

### Backend

| Script | Command | Description |
|--------|---------|-------------|
| Start | `npm start` | Start Express server on port 3001 |
| Dev | `npm run dev` | Start with `--watch` flag for auto-reload |

> **Note:** The database auto-seeds on first run when the modules table is empty. No manual seed step required.

---

## Architecture

### Single-Port Deployment

The backend serves **both** the REST API and the built frontend (`frontend/dist/`) on a single port (3001). The frontend uses `HashRouter` so all routes work without server-side route configuration. Non-API requests fall through to `index.html` via SPA fallback.

### Data Flow

```
SQLite DB (quantumthread.db — 10 tables)
   ↓
Express API (port 3001)
   ↓
API Client (api.js — relative paths, no base URL)
   ↓
Zustand Store (intelligence.store.js)
   ↓
React Pages (7 pages via HashRouter)
```

### Multi-Agent System

The backend orchestrates 5 analysis agents that run in parallel via `orchestrator.js`:

1. **Architecture Agent** — Codebase structure analysis
2. **Bug Detection Agent** — Bug pattern identification
3. **Security Agent** — Vulnerability detection
4. **Performance Agent** — Bottleneck detection
5. **Tutor Agent** — Educational explanations

A 6th standalone agent, **Code Agent** (`codeAgent.js`), handles code generation with 8+ templates (REST API, React Component, JWT Auth, SQLite CRUD, Python FastAPI, WebSocket, Jest Tests, Tailwind CSS). The `/code/generate` endpoint also runs all 5 analysis agents and returns their insights alongside the generated code.

### State Management

Zustand store (`intelligence.store.js`) provides:
- Centralized data cache for all intelligence endpoints
- Parallel `Promise.all()` bulk fetching
- Memoized selectors (entropy, gravity, security score, hub detection)
- Auto-refetch on repository change

### Database Schema (10 Tables)

| Table | Purpose |
|-------|---------|
| `projects` | User-created projects |
| `chat_history` | Agent chat messages |
| `agent_insights` | Agent analysis results |
| `impact_analysis` | Impact assessment records |
| `modules` | Repository modules with risk scores |
| `vulnerabilities` | CVE records with severity data |
| `dependencies` | Module dependency graph |
| `time_periods` | Version history / evolution metrics |
| `architecture_nodes` | ReactFlow node positions |
| `architecture_edges` | ReactFlow edge connections |

---

## Design System

The application follows a **compiler-native aesthetic**:

- **Max font size:** 14px (`text-sm`)
- **No box-shadows** — borders only
- **No border-radius > 6px** — `rounded-md` maximum
- **Max animation duration:** 150ms
- **Timing function:** linear only
- **Monospace** for all numeric values
- **Uppercase tracking-wider** for all section labels
- **Risk colors** applied to text only, never as background fills

Design constraints are enforced via CSS custom properties in `index.css` and `globals.css`. See [DESIGN_SYSTEM_REFERENCE.md](DESIGN_SYSTEM_REFERENCE.md) for the complete token specification.

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Component tree, data flow, folder structure |
| [design.md](design.md) | Design philosophy and UI guidelines |
| [DESIGN_SYSTEM_REFERENCE.md](DESIGN_SYSTEM_REFERENCE.md) | Complete design tokens and constraints |
| [PHASE_SUMMARY.md](PHASE_SUMMARY.md) | 10 implementation phases summary |
| [requirements.md](requirements.md) | Functional and non-functional requirements |

---

## Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port (serves API + frontend) |
| Vite dev port | `5173` | Frontend dev server (development only) |
| Vite proxy | Routes → `:3001` | API proxy for dev mode (`/intelligence`, `/projects`, `/chat`, `/impact`, `/health`) |
| Path alias | `@` → `/src` | Import path shortcut |

---

## License

ISC
