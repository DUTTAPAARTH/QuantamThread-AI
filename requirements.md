# QuantumThread AI - Hackathon Requirements

## Overview

QuantumThread AI is a Streamlit-powered code analysis tool that uses a team of AI agents to help developers understand and improve their code. The app combines local LLMs (via Ollama) with code analysis tools to create an intelligent assistant that can explain code, find bugs, and suggest security fixes—all running locally without sending your code to the cloud.

The system parses code with Tree-sitter, stores searchable embeddings in ChromaDB, builds relationship graphs with NetworkX, and lets you chat with specialized agents through a simple web interface. Perfect for hackathon demos: quick to set up, impressive visuals, and genuinely useful.

## User Personas

**The Solo Developer** – Building a side project, needs help understanding libraries they haven't used before

**The Team Lead** – Onboarding new devs, wants to visualize code dependencies and document architecture

**The Security-Conscious Dev** – Wants to quickly scan for vulnerabilities before pushing to production

## Core Use Cases

- Upload a codebase and watch agents analyze it in real-time
- Ask "What does this function do?" and get explanations with line numbers
- Click through an interactive graph showing how files depend on each other
- Run security scans and see results highlighted in the code viewer
- Save analysis sessions and come back to them later

## Functional Requirements

### Code Processing
- System must parse uploaded files with Tree-sitter to extract functions and classes
- System must store code chunks as embeddings in ChromaDB for semantic search
- System must build a basic NetworkX graph of file dependencies (imports/includes)

### AI Agents (Ollama)
- System must include 3 agents: Tutor (explains code), Bug Hunter (finds issues), Security (checks vulnerabilities)
- Agents must use local Ollama models (default: codellama or deepseek-coder)
- Chat interface must show which agent is responding and why

### User Interface (Streamlit)
- Main screen: chat sidebar + code viewer + graph visualization
- File browser to navigate uploaded code
- Graph view must be interactive (click nodes to see details)
- Security findings must show up as colored highlights in code

### Storage
- SQLite stores user sessions, chat history, and analysis results
- ChromaDB persists embeddings between runs
- No cloud dependencies – everything runs locally

## Non-Functional Requirements

- Setup in under 10 minutes (clone, install deps, run)
- Handles repos up to 10,000 files (demo-friendly)
- Agent responses in under 5 seconds with good hardware
- Clear error messages when Ollama isn't running

## Out of Scope for v1

- User accounts/login system
- Cloud LLM support (OpenAI, etc.)
- Real-time collaboration
- CI/CD integration
- Mobile app
- Multi-language support beyond Python/JavaScript