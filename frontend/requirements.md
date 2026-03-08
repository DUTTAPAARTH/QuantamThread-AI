# QuantumThread AI — Requirements

> Functional and non-functional requirements for the engineering intelligence console.

---

## Product Definition

QuantumThread AI is a **real-time engineering intelligence console** that provides automated codebase analysis, risk assessment, security scanning, dependency mapping, and architectural visualization. It is designed for engineering leads, architects, and senior developers who need to understand the health and structure of large codebases at a glance.

---

## Functional Requirements

### FR-01: Dashboard Overview

The Dashboard (`/`) SHALL:

1. Display 4 primary KPI metrics: Total Files Analyzed, High Risk Modules, Security Issues, Performance Bottlenecks
2. Render inline Sparkline bar charts for trend visualization
3. Render SVG arc gauges (270°) for risk-level indicators with color-coded thresholds
4. Provide quick-navigation cards linking to all 5 analysis pages
5. Show an activity feed summarizing recent analysis events
6. Update all metrics when the user switches the selected repository

### FR-02: Architecture Map

The Architecture Map (`/architecture`) SHALL:

1. Render an interactive node-edge graph using ReactFlow
2. Display custom `DepthBadgeNode` nodes showing module names with depth level indicators (L0, L1, L2, etc.)
3. Provide a MiniMap overlay for large graph navigation
4. Provide Controls overlay (zoom, fit, lock)
5. Allow node selection to open an inspector panel with module details
6. Support two repository configurations with distinct graph topologies
7. Load graph data from the `/intelligence/architecture` API endpoint

### FR-03: Bug & Risk Analysis

Bug & Risk Analysis (`/bug-risk`) SHALL:

1. Display a sortable module risk table with columns: module name, risk score, bug count, dependency count, impact radius, last modified
2. Provide 3 sort modes: cascade (by impact), volatility (by change frequency), standard (by risk score)
3. Calculate and display **Shannon Entropy** of bug distribution: `H = -Σ(p_i × log₂(p_i))`
4. Normalize entropy to percentage (0% = concentrated, 100% = uniform)
5. Provide interpretation: concentrated (<30%), distributed (30-70%), uniform (>70%)
6. Show a module inspector panel on selection with bug severity breakdown and AI summary
7. Render risk scores with semantic coloring (emerald for low, amber for medium, red for high)

### FR-04: Security Scanner

The Security Scanner (`/security`) SHALL:

1. Display all vulnerabilities in a filterable table with severity, exploitability, and patch status
2. Calculate a **Security Score**: `100 - min((critical×30 + high×15 + medium×8) / 100 × 100, 100)`
3. Show patch coverage percentage: `patchedCount / totalVulnerabilities × 100`
4. Display average exploitability rating across all vulnerabilities
5. Provide severity breakdown (critical, high, medium counts)
6. Show a vulnerability detail inspector on selection

### FR-05: Dependency Intelligence

Dependency Intelligence (`/dependencies`) SHALL:

1. Display all modules with in-degree, out-degree, depth, and circular dependency status
2. Detect **hub modules**: modules where `(inDegree + outDegree) / 2 > maxHubScore × 0.7`
3. Calculate **gravity scores**: `riskScore + (dependencyCount × 2)`
4. Analyze transitive exposure for cascade failure risk
5. Detect and flag circular dependency involvement
6. Provide 4 view modes: overview, gravity, exposure, simulation
7. Include a **failure simulation mode** toggle for "what-if" analysis
8. Support sorting by connections, risk, or depth

### FR-06: Repository Evolution

Repository Evolution (`/evolution`) SHALL:

1. Display time-series version history with per-release metrics
2. Calculate **Volatility Index** (0-100) measuring release instability
3. Track: risk score, vulnerability accumulation, dependency count, entropy, modules changed, commit count, average commit size, code churn, days to release, breaking changes, bugs fixed, feature count
4. Provide a timeline view for chronological analysis
5. Provide a quadrant view for multi-dimensional analysis
6. Provide coupling analysis between modules over time
7. Calculate risk trend (delta between first and last period)

### FR-07: Layout & Navigation

The Layout SHALL:

1. Render a fixed 256px sidebar with 6 navigation items using Material Symbols icons
2. Highlight the active navigation item based on current route
3. Render a fixed 56px header with:
   - Repository selector dropdown (2+ repositories)
   - Branch selector dropdown (main, staging, feature-auth)
   - Global search input
   - Dynamically calculated confidence score badge
   - User profile section
4. Pass selected repository, branch, and repo config to child pages via Outlet context
5. Remain stable during page transitions (no layout shifts)

### FR-08: State Management

The Zustand store SHALL:

1. Maintain centralized state for: modules, vulnerabilities, dependencies, timePeriods, architecture, summary
2. Track loading, error, and initialization state
3. Provide `fetchAll(repo)` for parallel bulk data loading via `Promise.all()`
4. Provide individual fetch methods for each data slice
5. Provide memoized selectors: `getModuleById`, `calculateEntropy`, `calculateGravity`, `getSecurityScore`, `getHubModules`, `getRiskTrend`
6. Auto-refetch all data when `setSelectedRepository()` is called
7. Maintain UI state: selectedRepository, selectedBranch, selectedVersion

### FR-09: API Communication

The API client SHALL:

1. Point all requests to `http://localhost:3001`
2. Include `Content-Type: application/json` header on all requests
3. Parse JSON responses and throw descriptive errors on failure
4. Provide named exports for all 6 intelligence endpoints, project CRUD, chat, impact, and health
5. Support repository filtering via `?repo=` query parameter

### FR-10: Backend Intelligence API

The Express backend SHALL:

1. Serve on port 3001 with CORS enabled
2. Provide `/health` endpoint returning service status and agent list
3. Provide `/intelligence/*` routes for modules, vulnerabilities, dependencies, evolution, architecture, summary
4. Use SQLite3 for persistent data storage
5. Initialize database schema on startup
6. Support seeding via `node seed-intelligence.js`
7. Coordinate 5 AI agents via the orchestrator (architecture, bug, security, performance, tutor)
8. Handle errors with appropriate HTTP status codes

---

## Non-Functional Requirements

### NFR-01: Design System Compliance

All UI components SHALL:

1. Never exceed 14px (`text-sm`) maximum font size
2. Never use `box-shadow` on any element
3. Never use `border-radius` greater than 6px (`rounded-md`)
4. Never use animation durations exceeding 150ms
5. Never use `transform`, `scale`, `rotate`, or `filter` animations
6. Use monospace font rendering for all numeric values
7. Use uppercase + tracking-wider for all section labels
8. Use only opacity, border-color, background-color, and color for transitions
9. Communicate depth through borders only (never shadows)

### NFR-02: Performance

1. Page render time SHALL be under 100ms for standard datasets
2. State updates SHALL use debouncing (150ms default) for hover/input handlers
3. Large tables (50+ rows) SHALL support virtual scrolling
4. Sort/filter operations SHALL be memoized with dependency tracking
5. IntersectionObserver SHALL be used for lazy-loading below-fold content
6. RAF-aligned updates SHALL be used for smooth 60fps rendering

### NFR-03: Code Quality

1. All files SHALL use ES module syntax (`import`/`export`)
2. React components SHALL use functional component pattern with hooks
3. State management SHALL use Zustand (no Redux, no Context API for global state)
4. Routing SHALL use React Router v7 with nested routes under a Layout shell
5. Styling SHALL use TailwindCSS utility classes (no CSS-in-JS, minimal custom CSS)
6. ESLint SHALL be configured with react-hooks and react-refresh plugins

### NFR-04: Architecture

1. Frontend and backend SHALL run as separate processes
2. Communication SHALL be REST-only (no WebSocket, no GraphQL)
3. State SHALL flow unidirectionally: Backend → API Client → Zustand Store → React Components
4. No component SHALL directly call `fetch()` — all API calls go through `api.js`
5. No component SHALL mutate store state directly — all mutations go through store actions

### NFR-05: Browser Support

1. Target: Chromium-based browsers (Chrome, Edge) at 1440px+ viewport width
2. No mobile/responsive layout requirements
3. Fixed layout with `overflow-hidden` to prevent unexpected scrolling
4. `100vh` / `100vw` root container

---

## Data Requirements

### Modules (Bug & Risk)

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| name | string | Module name |
| riskScore | integer (0-100) | Aggregate risk rating |
| riskLevel | enum | low / medium / high |
| bugCount | integer | Total known bugs |
| dependencyCount | integer | Number of dependencies |
| impactRadius | integer | Cascade impact count |
| lastModified | string | Human-readable timestamp |
| bugs | JSON array | `[{ severity, count }]` |
| aiSummary | string | AI-generated analysis |
| repository | string | Repository name |

### Vulnerabilities (Security)

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| name / cve | string | Vulnerability identifier |
| severity | enum | critical / high / medium / low |
| exploitability | float (0-10) | Exploitability rating |
| patchVersion | string | Patch available (or null) |
| repository | string | Repository name |

### Dependencies

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| module / name | string | Module name |
| inDegree / incomingCount | integer | Incoming dependency count |
| outDegree / outgoingCount | integer | Outgoing dependency count |
| depth | integer | Dependency tree depth |
| circularInvolvement | boolean | Part of a circular dependency |
| transitiveExposure | float | Transitive risk exposure |
| directDeps | JSON array | Direct dependency names |
| reverseDeps | JSON array | Reverse dependency names |

### Time Periods (Evolution)

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| version | string | Release version |
| date | string | Release date |
| riskScore | integer | Period risk score |
| vulnerability_accumulation | integer | Cumulative vulnerabilities |
| dependency_count | integer | Dependencies at this version |
| entropy | float | Risk distribution entropy |
| modulesChanged | integer | Modules modified |
| commitCount | integer | Commits in period |
| avgCommitSize | float | Average commit size |
| codeChurn | float | Lines changed |
| daysToRelease | integer | Days between releases |
| breakingChanges | integer | Breaking changes count |
| bugsFixed | integer | Bugs fixed in period |
| featureCount | integer | Features added |

### Architecture (Graph)

| Structure | Fields |
|-----------|--------|
| Nodes | id, label, type, position(x,y), depthLevel |
| Edges | id, source, target, type |
