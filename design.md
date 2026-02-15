# QuantumThread AI - System Design (v1)

## Architecture Overview

QuantumThread AI is built as a web application with an HTML/CSS/JavaScript frontend and Python backend that handles all the AI processing and code analysis logic. This approach separates the user interface from the computational heavy lifting while maintaining simplicity for hackathon development—the frontend provides an intuitive web interface while the backend handles all the complex operations like Tree-sitter parsing, Ollama model interactions, and graph building.

The application follows a modular internal architecture where the frontend communicates with backend endpoints through a REST API. When a user uploads code, the ingestion pipeline parses files with Tree-sitter, runs Semgrep and Bandit scans, generates embeddings stored in ChromaDB, and builds a relationship graph with NetworkX—all in the Python backend. The HTML/CSS/JS frontend provides real-time feedback through WebSocket connections as each step completes. For chat interactions, the Agent Orchestrator receives queries via API calls, retrieves relevant context from ChromaDB and NetworkX, and invokes the appropriate Ollama model through a client wrapper, streaming responses back to the frontend.

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (HTML/CSS/JavaScript)                              │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ UI Components                                         │   │
│ │ ┌────────────┐ ┌────────────┐ ┌──────────────────┐   │   │
│ │ │ Chat       │ │ Code View  │ │ Graph Explorer   │   │   │
│ │ │ Interface  │ │ Component  │ │ Visualization    │   │   │
│ │ └────────────┘ └────────────┘ └──────────────────┘   │   │
│ └───────────────────────────────────────────────────────┘   │
│                           │                                 │
│                      REST API / WebSocket                   │
└───────────────────────────┼─────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│ Python Backend                                              │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ API Layer                                             │   │
│ │ (Request Routing, File Handling, WebSocket Manager)  │   │
│ └───────────────────────────────────────────────────────┘   │
│ │                                                           │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Core Modules                                          │   │
│ │                                                       │   │
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │   │
│ │ │ Code         │◀─┤ Agent        │─▶│ Analysis     │   │   │
│ │ │ Ingestion    │  │ Orchestrator │  │ Engine       │   │   │
│ │ │              │  │              │  │              │   │   │
│ │ │ • Tree-sitter│  │ • Router     │  │ • Semgrep    │   │   │
│ │ │ • Parser     │  │ • Agents:    │  │ • Bandit     │   │   │
│ │ │ • Chunker    │  │  - Tutor     │  │ • Rule Mgr   │   │   │
│ │ └──────────────┘  │  - BugHunter │  └──────────────┘   │   │
│ │                   │  - Security  │                     │   │
│ │ ┌──────────────┐  │  - Architect │  ┌──────────────┐   │   │
│ │ │ Vector       │  │  - Reviewer  │  │ Knowledge    │   │   │
│ │ │ DB Adapter   │  └──────────────┘  │ Graph        │   │   │
│ │ │              │                    │              │   │   │
│ │ │ • ChromaDB   │                    │ • NetworkX   │   │   │
│ │ │ • Collections│                    │ • Metrics    │   │   │
│ │ └──────────────┘  ▼                 └──────────────┘   │   │
│ │                 ┌──────────────┐                       │   │
│ │                 │ LLM Client   │                       │   │
│ │                 │              │                       │   │
│ │                 │ • Ollama SDK │                       │   │
│ │                 │ • Retry/     │                       │   │
│ │                 │   Fallback   │                       │   │
│ │                 └──────────────┘                       │   │
│ └───────────────────────────────────────────────────────┘   │
│ │                                                           │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Persistence Layer                                     │   │
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │   │
│ │ │ SQLite       │ │ ChromaDB     │ │ NetworkX     │   │   │
│ │ │ • Tables     │ │ • Vectors    │ │ • Graph obj  │   │   │
│ │ │ • Sessions   │ │ • Metadata   │ │ • Serialized │   │   │
│ │ └──────────────┘ └──────────────┘ └──────────────┘   │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Main Components

### HTML/CSS/JS Frontend + API Integration
**Responsibilities**: Render all user interface elements, handle file uploads, display chat conversations, show code with syntax highlighting, render interactive NetworkX graphs, and communicate with backend through REST API and WebSocket connections.

**Interactions**: Makes HTTP requests to backend API for file uploads and data retrieval, establishes WebSocket connections for real-time chat and progress updates, renders graph visualizations using D3.js or similar, and maintains session state in browser localStorage.

### Code Ingestion & Indexing Service
**Responsibilities**: Parse uploaded code using Tree-sitter to extract functions, classes, and dependencies; split code into semantically meaningful chunks; generate embeddings; trigger static analysis tools.

**Interactions**: Stores parsed metadata in SQLite, saves embeddings to ChromaDB, builds initial graph structure in NetworkX, and invokes Analysis Engine for Semgrep/Bandit scans. Reports progress back to frontend via WebSocket.

### Agent Orchestration Engine
**Responsibilities**: Maintain registry of available agents (Tutor, BugHunter, Security, Architect, Code Reviewer), route user queries to appropriate agent based on intent, manage conversation context, and coordinate multi-agent workflows.

**Interactions**: Receives queries from frontend API, retrieves relevant code context from ChromaDB (via Vector DB Adapter), queries graph relationships from NetworkX, invokes LLM Client for agent reasoning, and streams responses back to frontend via WebSocket.

### Analysis Engine
**Responsibilities**: Run Semgrep and Bandit scans on code files, manage rule configurations, parse tool outputs into structured findings, and correlate findings with code locations.

**Interactions**: Called by Code Ingestion during initial processing or manually via API endpoints, stores findings in SQLite, adds vulnerability nodes/edges to NetworkX graph, and notifies frontend of new results.

### Vector DB Adapter
**Responsibilities**: Abstract ChromaDB operations, manage collection lifecycles, provide semantic search interface, handle embedding generation and storage.

**Interactions**: Receives chunks from Code Ingestion for storage, provides similarity search to Agent Orchestrator, maintains collection metadata in SQLite, and handles collection versioning.

### Knowledge Graph Module
**Responsibilities**: Build and maintain NetworkX graph representing code structure, compute graph metrics, provide traversal and query interfaces, serialize/deserialize graph to SQLite.

**Interactions**: Receives node/edge data from Code Ingestion, provides relationship queries to Agent Orchestrator, exports visualization data to frontend API, and persists graph state to SQLite.

### LLM Client Abstraction
**Responsibilities**: Wrap Ollama Python SDK, handle model initialization, manage prompt templating, implement retry logic with exponential backoff, and provide streaming response interface.

**Interactions**: Called exclusively by Agent Orchestrator, maintains connection pool to Ollama, formats prompts with context from other components, and streams token-by-token responses.

### Persistence Layer
**Responsibilities**: Manage all SQLite database operations, provide repository pattern for data access, handle migrations, and ensure data integrity.

**Interactions**: All components use this layer to store and retrieve persistent data. Maintains references to ChromaDB collection IDs and serialized NetworkX graphs.

## Key Flows

### Flow 1: Ingesting a New Repository
1. User uploads zip file or selects local directory through HTML file input
2. Frontend sends POST request to backend API with file data
3. API Layer validates input and creates a new project record in SQLite
4. Code Ingestion Service recursively walks directory, identifying supported files
5. For each file:
   a. Tree-sitter parses code to extract AST
   b. Functions and classes are identified and stored as nodes in NetworkX
   c. Dependencies (imports, calls) are added as edges in NetworkX
   d. Code is split into chunks and sent to Vector DB Adapter
   e. Vector DB Adapter generates embeddings and stores in ChromaDB
6. Analysis Engine runs Semgrep and Bandit on all files
7. Security findings are added as nodes/edges in NetworkX and stored in SQLite
8. Knowledge Graph Module computes basic metrics (centrality, complexity)
9. Graph is serialized to SQLite for persistence
10. WebSocket updates sent to frontend showing progress and completion
11. Frontend displays summary dashboard with interactive elements

### Flow 2: Answering "Explain this function"
1. User types question in chat: "What does the process_data function do?"
2. Frontend sends query via WebSocket to backend
3. Agent Orchestrator receives query and extracts key terms
4. Vector DB Adapter performs semantic search in ChromaDB using query embedding
5. Top matching code chunks are retrieved with their file paths and line numbers
6. Knowledge Graph Module retrieves:
   a. Callers and callees of this function
   b. Related modules and dependencies
   c. Any security findings associated with this code
7. Orchestrator selects Tutor agent as most appropriate
8. LLM Client formats prompt with:
   a. Retrieved code chunks
   b. Graph context (dependencies, relationships)
   c. User's original question
9. Ollama generates explanation, streaming tokens to frontend via WebSocket
10. Frontend displays response with citations as clickable links
11. Conversation history saved to SQLite

### Flow 3: Running Static Analysis on a PR
1. User selects "Analyze Changes" and uploads a diff or specifies changed files
2. Frontend sends analysis request to backend API
3. Analysis Engine identifies modified files from the input
4. For each modified file:
   a. Runs Semgrep with security and best-practice rules
   b. Runs Bandit for Python-specific vulnerabilities
   c. Compares results with previous run (if any) to identify new issues
5. New findings are:
   a. Stored in SQLite with timestamps and file locations
   b. Added as nodes in NetworkX (connected to relevant code nodes)
   c. Sent to frontend for highlighting in code viewer
6. Security agent automatically generates remediation suggestions using Ollama
7. Frontend shows summary table: new issues, fixed issues, total by severity
8. User can click any issue to see detailed explanation and suggested fix
9. Option to export report as markdown for PR comments

## Data Model & Storage

### SQLite Tables

**users**
- id (PK), username, created_at, settings_json

**projects**
- id (PK), name, path, created_at, last_analyzed, file_count, graph_serialized (BLOB)

**analysis_runs**
- id (PK), project_id (FK), run_type, status, started_at, completed_at, summary_json

**findings**
- id (PK), run_id (FK), tool (semgrep/bandit), rule_id, severity, file_path, line_start, line_end, message, remediation

**conversations**
- id (PK), project_id (FK), user_id (FK), created_at, title

**messages**
- id (PK), conversation_id (FK), role (user/agent), agent_type, content, timestamp, context_json

**agent_events**
- id (PK), run_id (FK), agent_type, action, duration_ms, tokens_used, metadata_json

**chroma_collections**
- id (PK), name, embedding_model, created_at, last_updated, doc_count

### ChromaDB Collections

**code_chunks**
- Stores code snippets with embeddings
- Metadata: file_path, language, chunk_type (function/class/block), start_line, end_line, project_id, hash

**docs_collection** (future)
- For project documentation, READMEs, comments

**run_history**
- Stores embeddings of past analysis runs for trend detection

### NetworkX Graph Structure

**Node Types and Attributes**
- `File`: path, language, size, last_modified
- `Function`: name, line_start, line_end, complexity, docstring
- `Class`: name, line_start, line_end, methods_count
- `Module`: name, path
- `Finding`: rule_id, severity, tool
- `Agent`: type, last_active

**Edge Types**
- `IMPORTS`: File → Module, weight = 1
- `CALLS`: Function → Function, weight = call_count
- `CONTAINS`: File → Function/Class, weight = 1
- `INHERITS`: Class → Class, weight = 1
- `HAS_FINDING`: File/Function → Finding, weight = severity_score
- `RELATED_TO`: semantic similarity edges (threshold-based)

## Scalability & Limits

### Current Frontend-Backend Split Approach
- HTML/CSS/JS frontend handles UI rendering and user interactions
- Python backend processes all analysis in dedicated worker threads
- Large repos (>10K files) processed in batches with WebSocket progress updates
- NetworkX graphs kept in memory; serialized to SQLite between sessions
- ChromaDB operations are asynchronous; frontend remains responsive

### Scaling Strategies for Hackathon Demos
- Pre-filtering: Users select subdirectories for focused analysis
- Lazy loading: Graph visualizations load on-demand using D3.js streaming
- Caching: Embeddings and analysis results cached to avoid recomputation
- Async processing: Long operations run in background with real-time status updates

### Future Splits (Post-Hackathon)
- Background worker process for ingestion and analysis
- Separate API service (FastAPI) with pure frontend client
- Distributed ChromaDB for larger vector collections
- Redis for caching and job queues
- Containerized deployment with Docker

## Security & Permissions

### Local-First Security Model
- All code stays on user's machine; no data sent to external APIs
- Ollama runs locally, ensuring code never leaves environment
- SQLite and ChromaDB files stored locally with user permissions

### Input Validation
- File uploads limited to source code extensions and sizes
- Zip bombs prevented by size limits and depth checks
- Path traversal attacks blocked by sanitizing file paths
- CORS policies restrict direct API access

### Agent Guardrails
- Prompt injection attempts detected via pattern matching
- Agents restricted to code analysis tasks; cannot execute system commands
- Token limits prevent runaway generations
- All API endpoints validate request origins

### Authentication (Optional)
- Simple token-based auth for demo instances
- No multi-user support in v1; runs as single-user desktop app
- Session management handled via secure HTTP cookies

## Future Evolution

### Multi-Service Architecture
The frontend-backend split can evolve into:
- **Frontend Service**: Pure HTML/CSS/JS client (deployable to CDN)
- **API Gateway**: FastAPI with WebSocket support and load balancing
- **Orchestrator Service**: Manages agent workflows
- **Worker Pool**: Handles ingestion, analysis, and embeddings
- **Graph Service**: Dedicated NetworkX server with caching
- **Vector Service**: ChromaDB with replication

### Multi-LLM Support
- Abstract LLM client to support OpenAI, Anthropic, etc.
- Model routing based on task complexity
- Cost tracking and quota management
- A/B testing for model effectiveness

### Distributed Storage
- PostgreSQL instead of SQLite for multi-user support
- Distributed ChromaDB cluster for large-scale deployments
- Redis for real-time collaboration features
- CDN for static assets and caching

### Advanced Features
- Real-time collaborative analysis sessions
- CI/CD integration with GitHub Actions
- VS Code extension for in-editor insights
- Team dashboards with trend analysis
- Progressive Web App (PWA) capabilities for offline analysis