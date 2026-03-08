import { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";

const Icon = ({ name, className = "", style = {} }) => (
  <span className={`material-symbols-outlined ${className}`} style={style}>
    {name}
  </span>
);

// Initial nodes configuration
const initialNodes = [
  {
    id: "1",
    position: { x: 250, y: 50 },
    data: { label: "Core API", risk: "high", load: 95 },
  },
  {
    id: "2",
    position: { x: 100, y: 200 },
    data: { label: "Event Stream", risk: "medium", load: 68 },
  },
  {
    id: "3",
    position: { x: 400, y: 200 },
    data: { label: "UI Shell", risk: "low", load: 45 },
  },
  {
    id: "4",
    position: { x: 250, y: 350 },
    data: { label: "Vector Store", risk: "low", load: 32 },
  },
  {
    id: "5",
    position: { x: 550, y: 120 },
    data: { label: "Auth Service", risk: "medium", load: 78 },
  },
];

// Initial edges configuration
const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
    animated: false,
    style: { stroke: "#cbd5e1", strokeWidth: 2 },
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    type: "smoothstep",
    animated: false,
    style: { stroke: "#cbd5e1", strokeWidth: 2 },
  },
  {
    id: "e1-5",
    source: "1",
    target: "5",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#fca5a5", strokeWidth: 2 },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    type: "smoothstep",
    animated: false,
    style: { stroke: "#cbd5e1", strokeWidth: 2 },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    type: "smoothstep",
    animated: false,
    style: { stroke: "#cbd5e1", strokeWidth: 2 },
  },
];

const moduleIntelligence = {
  1: {
    impact: 87,
    summary:
      "Primary gateway for service orchestration. Handles request shaping and routing across critical subsystems. Stability here directly influences uptime and latency budgets.",
  },
  2: {
    impact: 62,
    summary:
      "Streams domain events into analytics and alerting pipelines. Risk rises during peak load and schema changes. Recent updates improved throughput but added coupling.",
  },
  3: {
    impact: 41,
    summary:
      "Client interface container responsible for rendering modular views. Low risk but a common dependency for releases and feature toggles.",
  },
  4: {
    impact: 34,
    summary:
      "Vector embeddings store powering semantic search. Low risk surface area with predictable traffic patterns and strong cache coverage.",
  },
  5: {
    impact: 71,
    summary:
      "Authentication boundary enforcing token validation and session integrity. Medium risk due to frequent policy updates and external integrations.",
  },
};

const metrics = [
  {
    title: "Total Files Analyzed",
    value: "12,842",
    badge: "+4.2%",
    icon: "description",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    badgeColor: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "High Risk Modules",
    value: "14",
    badge: "High Risk",
    icon: "warning",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    badgeColor: "bg-orange-50 text-orange-600",
  },
  {
    title: "Security Issues",
    value: "5",
    badge: "Critical",
    icon: "security",
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    badgeColor: "bg-red-50 text-red-600",
  },
  {
    title: "Performance Bottlenecks",
    value: "28",
    badge: "Stable",
    icon: "speed",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    badgeColor: "bg-blue-50 text-blue-600",
  },
];

const activityItems = [
  {
    id: 1,
    agentType: "Architect",
    agent: "Architect Agent",
    minutesAgo: 2,
    icon: "architecture",
    severity: "medium",
    message:
      "Mapping new service NotificationHub. Detected 3 potential circular routes in the service mesh configuration.",
    detailedExplanation:
      "The Architect Agent has identified circular dependency patterns in the NotificationHub service configuration. These circular routes can lead to cascading failures and increased latency during high-load scenarios. Recommendation: Implement a dependency injection pattern to break circular references and establish clear service boundaries.",
  },
  {
    id: 2,
    agentType: "Bug Hunter",
    agent: "Bug Hunter Agent",
    minutesAgo: 12,
    icon: "pest_control",
    severity: "high",
    message: "SQL Injection risk found in LegacySearchProvider.ts:142.",
    detailedExplanation:
      "Critical security vulnerability detected: unsanitized user input is being directly concatenated into SQL queries in LegacySearchProvider.ts at line 142. This creates a direct SQL injection attack vector. Immediate action required: Replace string concatenation with parameterized queries or use an ORM with built-in escaping. Estimated fix time: 2 hours. Risk score: 9.3/10.",
  },
  {
    id: 3,
    agentType: "Optimizer",
    agent: "Optimizer Agent",
    minutesAgo: 45,
    icon: "bolt",
    severity: "low",
    message:
      "Completed cache-hit analysis for DashboardAPI. Proposed 15% reduction in Redis latency by restructuring key TTLs.",
    detailedExplanation:
      "Performance analysis completed on DashboardAPI cache layer. Current cache hit rate: 67%. By implementing a multi-tier TTL strategy with hot-path optimization, we can achieve a 15% reduction in Redis query latency and improve hit rate to ~82%. Proposed changes include: (1) Short TTL (5min) for frequently accessed keys, (2) Medium TTL (30min) for moderate access patterns, (3) Long TTL (2hr) for rarely changing data.",
  },
  {
    id: 4,
    agentType: "Security",
    agent: "Security Scanner",
    minutesAgo: 60,
    icon: "shield",
    severity: "medium",
    message:
      "Outdated dependencies detected in authentication module. 2 packages require immediate updates.",
    detailedExplanation:
      "Dependency audit identified two packages with known security vulnerabilities: jsonwebtoken@8.5.1 (CVE-2022-23529) and express-validator@6.12.0 (CVE-2021-3765). Both packages have patches available. Recommended action: Update jsonwebtoken to v9.0.0+ and express-validator to v6.14.0+. No breaking changes expected. Automated PR will be generated.",
  },
  {
    id: 5,
    agentType: "Tutor",
    agent: "AI Tutor",
    minutesAgo: 120,
    icon: "school",
    severity: "low",
    message:
      "Code review suggestion: Consider async/await refactor in PaymentProcessor for improved readability.",
    detailedExplanation:
      "The PaymentProcessor module currently uses nested promise chains (.then/.catch) which reduces code maintainability. Converting to async/await syntax would improve error handling clarity and reduce cognitive load. This is a low-priority refactor but would benefit the team's ability to quickly understand payment flow logic. Estimated refactor time: 3 hours. No functional changes required.",
  },
];

// Helper function to get connected node IDs
const getConnectedNodeIds = (nodeId, edges) => {
  return edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .map((edge) => (edge.source === nodeId ? edge.target : edge.source));
};

const tutorResponses = {
  explain: {
    purpose:
      "Main HTTP request handler that orchestrates authentication, session management, and routing to domain-specific controllers.",
    responsibilities: [
      "Extract user credentials from request body",
      "Validate against authentication provider",
      "Generate session tokens",
      "Route authenticated requests to appropriate service",
      "Log security events for audit trails",
    ],
    riskObservations: [
      "High complexity in single function (14 branches)",
      "Direct database queries without parameterization",
      "Session tokens stored in plain text",
      "No rate limiting on failed attempts",
    ],
    dependencies: ["TokenGenerator", "SessionManager", "UserValidator"],
  },
  flow: [
    { step: 1, module: "Client Request", description: "POST /auth/login" },
    { step: 2, module: "handleLogin()", description: "Parse credentials" },
    { step: 3, module: "UserValidator", description: "Check credentials" },
    { step: 4, module: "TokenGenerator", description: "Create JWT" },
    { step: 5, module: "SessionManager", description: "Store session" },
    {
      step: 6,
      module: "Response",
      description: "Return token + user data",
    },
  ],
  followUp: {
    "how do I optimize this?":
      "Consider breaking this into smaller functions: (1) validateCredentials(), (2) generateToken(), (3) createSession(). Use dependency injection to reduce coupling. Implement caching layer for frequently validated users.",
    "what are the security risks?":
      "Critical issues: (1) No HTTPS enforcement in code, (2) Tokens stored without encryption, (3) No CORS validation. Implement: JWT with short expiry, refresh token rotation, rate limiting (5 attempts/min), and OWASP compliance check.",
    "how does this integrate with other services?":
      "This acts as the gateway. EventStream listens for auth events. UI Shell validates tokens on each request. PaymentGateway trusts tokens issued here. Consider circuit breaker for downstream failures.",
  },
};

// Repository configurations for Phase 9: System Credibility Layer
const repositoriesConfig = {
  "Quantum-Core": {
    name: "Quantum-Core",
    fullName: "quantum-core-v2",
    nodes: [
      {
        id: "1",
        position: { x: 250, y: 50 },
        data: { label: "Core API", risk: "high", load: 95 },
      },
      {
        id: "2",
        position: { x: 100, y: 200 },
        data: { label: "Event Stream", risk: "medium", load: 68 },
      },
      {
        id: "3",
        position: { x: 400, y: 200 },
        data: { label: "UI Shell", risk: "low", load: 45 },
      },
      {
        id: "4",
        position: { x: 250, y: 350 },
        data: { label: "Vector Store", risk: "low", load: 32 },
      },
      {
        id: "5",
        position: { x: 550, y: 120 },
        data: { label: "Auth Service", risk: "medium", load: 78 },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      },
      {
        id: "e1-3",
        source: "1",
        target: "3",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      },
      {
        id: "e1-5",
        source: "1",
        target: "5",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#fca5a5", strokeWidth: 2 },
      },
      {
        id: "e2-4",
        source: "2",
        target: "4",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      },
      {
        id: "e3-4",
        source: "3",
        target: "4",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      },
    ],
    metrics: [
      {
        title: "Total Files Analyzed",
        value: "12,842",
        badge: "+4.2%",
        icon: "description",
        iconColor: "text-blue-600",
        iconBg: "bg-blue-50",
        badgeColor: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "High Risk Modules",
        value: "14",
        badge: "High Risk",
        icon: "warning",
        iconColor: "text-orange-500",
        iconBg: "bg-orange-50",
        badgeColor: "bg-orange-50 text-orange-600",
      },
      {
        title: "Security Issues",
        value: "5",
        badge: "Critical",
        icon: "security",
        iconColor: "text-red-500",
        iconBg: "bg-red-50",
        badgeColor: "bg-red-50 text-red-600",
      },
      {
        title: "Performance Bottlenecks",
        value: "28",
        badge: "Stable",
        icon: "speed",
        iconColor: "text-blue-500",
        iconBg: "bg-blue-50",
        badgeColor: "bg-blue-50 text-blue-600",
      },
    ],
    branchRiskModifiers: { main: 0, staging: 2, "feature-auth": 5 },
  },
  "Payment-Service": {
    name: "Payment-Service",
    fullName: "payment-service-api",
    nodes: [
      {
        id: "1",
        position: { x: 250, y: 50 },
        data: { label: "Payment Gateway", risk: "high", load: 92 },
      },
      {
        id: "2",
        position: { x: 100, y: 200 },
        data: { label: "Transaction Ledger", risk: "high", load: 85 },
      },
      {
        id: "3",
        position: { x: 400, y: 200 },
        data: { label: "Webhook Handler", risk: "medium", load: 56 },
      },
      {
        id: "4",
        position: { x: 250, y: 350 },
        data: { label: "Settlement Engine", risk: "high", load: 72 },
      },
      {
        id: "5",
        position: { x: 550, y: 120 },
        data: { label: "Card Processor", risk: "medium", load: 68 },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      },
      {
        id: "e1-3",
        source: "1",
        target: "3",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      },
      {
        id: "e1-5",
        source: "1",
        target: "5",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#fca5a5", strokeWidth: 2 },
      },
      {
        id: "e2-4",
        source: "2",
        target: "4",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      },
      {
        id: "e4-3",
        source: "4",
        target: "3",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#cbd5e1", strokeWidth: 2 },
      },
    ],
    metrics: [
      {
        title: "Total Files Analyzed",
        value: "8,420",
        badge: "+2.1%",
        icon: "description",
        iconColor: "text-blue-600",
        iconBg: "bg-blue-50",
        badgeColor: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "High Risk Modules",
        value: "22",
        badge: "Critical",
        icon: "warning",
        iconColor: "text-orange-500",
        iconBg: "bg-orange-50",
        badgeColor: "bg-red-50 text-red-600",
      },
      {
        title: "Security Issues",
        value: "8",
        badge: "Urgent",
        icon: "security",
        iconColor: "text-red-500",
        iconBg: "bg-red-50",
        badgeColor: "bg-red-50 text-red-600",
      },
      {
        title: "Performance Bottlenecks",
        value: "42",
        badge: "Degrading",
        icon: "speed",
        iconColor: "text-orange-500",
        iconBg: "bg-orange-50",
        badgeColor: "bg-orange-50 text-orange-600",
      },
    ],
    branchRiskModifiers: { main: 0, staging: 3, "feature-auth": 7 },
  },
};

// Helper function to format relative timestamps
const formatRelativeTime = (minutesAgo) => {
  if (minutesAgo === 0) return "just now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo}d ago`;
};

// Helper function to calculate repository confidence score
const calculateConfidenceScore = (riskModules, securityIssues, bottlenecks) => {
  const baseScore = 100;
  const riskPenalty = riskModules * 2;
  const securityPenalty = securityIssues * 3.5;
  const bottleneckPenalty = Math.floor(bottlenecks / 2);
  const score = Math.max(0, baseScore - riskPenalty - securityPenalty - bottleneckPenalty);
  return Math.round(score);
};

function App() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [simulateImpact, setSimulateImpact] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [tutorResponse, setTutorResponse] = useState(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [followUpInput, setFollowUpInput] = useState("");
  const [selectedRepository, setSelectedRepository] = useState("Quantum-Core");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Initialize nodes and edges based on selected repository
  const repoConfig = repositoriesConfig[selectedRepository];
  const [nodes, setNodes, onNodesChange] = useNodesState(repoConfig.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(repoConfig.edges);
  
  // Update nodes when repository changes
  useEffect(() => {
    const newRepoConfig = repositoriesConfig[selectedRepository];
    const branchModifier = newRepoConfig.branchRiskModifiers[selectedBranch] || 0;
    const adjustedNodes = newRepoConfig.nodes.map((node) => {
      if (branchModifier > 0 && (node.data.risk === "low" || node.data.risk === "medium")) {
        return {
          ...node,
          data: {
            ...node.data,
            risk: "high",
          },
        };
      }
      return node;
    });
    setNodes(adjustedNodes);
    setEdges(newRepoConfig.edges);
    setSelectedNodeId(null);
  }, [selectedRepository, selectedBranch, setNodes, setEdges]);

  // Update current time every 10 seconds for relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleExplainFunction = useCallback(() => {
    setTutorLoading(true);
    setActiveAction("explain");
    setTimeout(() => {
      setTutorResponse(tutorResponses.explain);
      setTutorLoading(false);
    }, 800);
  }, []);

  const handleGenerateFlow = useCallback(() => {
    setTutorLoading(true);
    setActiveAction("flow");
    setTimeout(() => {
      setTutorResponse(tutorResponses.flow);
      setTutorLoading(false);
    }, 800);
  }, []);

  const handleFollowUp = useCallback(() => {
    if (!followUpInput.trim()) return;
    setTutorLoading(true);
    setActiveAction("followup");
    const question = followUpInput.toLowerCase();
    setTimeout(() => {
      const response =
        tutorResponses.followUp[question] ||
        "That's an interesting question! Based on code analysis: " +
          "Consider implementing middleware-based architecture to decouple concerns. Use async/await patterns consistently, add comprehensive unit tests, and implement structured error handling with contextual logging.";
      setTutorResponse(response);
      setFollowUpInput("");
      setTutorLoading(false);
    }, 800);
  }, [followUpInput]);

  const onNodeDragStop = useCallback((event, node) => {
    console.log("Node dragged:", node);
  }, []);

  // Compute connected nodes and apply dynamic styling
  const connectedNodes = useMemo(() => {
    return selectedNodeId ? getConnectedNodeIds(selectedNodeId, edges) : [];
  }, [selectedNodeId, edges]);

  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      const isConnected = connectedNodes.includes(node.id);
      const isImpactMode = simulateImpact && selectedNodeId;

      return {
        ...node,
        style: {
          ...node.style,
          opacity: selectedNodeId && !isSelected && !isConnected ? 0.4 : 1,
          border: isSelected
            ? "2px solid #2563eb"
            : isConnected && isImpactMode
              ? "2px solid #ef4444"
              : isConnected
                ? "1px solid #2563eb"
                : "1px solid #e2e8f0",
          boxShadow: isSelected
            ? isImpactMode
              ? "0 0 20px rgba(239, 68, 68, 0.4)"
              : "0 4px 12px rgba(37,99,235,0.3)"
            : isConnected && isImpactMode
              ? "0 0 16px rgba(239, 68, 68, 0.25)"
              : "0 2px 6px rgba(0,0,0,0.05)",
        },
      };
    });
  }, [nodes, selectedNodeId, connectedNodes, simulateImpact]);

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isConnected =
        selectedNodeId &&
        (edge.source === selectedNodeId || edge.target === selectedNodeId);
      const isImpactMode = simulateImpact && selectedNodeId;

      return {
        ...edge,
        style: {
          stroke:
            isConnected && isImpactMode
              ? "#ef4444"
              : isConnected
                ? "#2563eb"
                : "#cbd5e1",
          strokeWidth: isConnected && isImpactMode ? 2.5 : isConnected ? 2 : 1,
        },
      };
    });
  }, [edges, selectedNodeId, simulateImpact]);

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const dependencyCount = useMemo(() => {
    if (!selectedNodeId) {
      return 0;
    }
    return edges.filter(
      (edge) =>
        edge.source === selectedNodeId || edge.target === selectedNodeId,
    ).length;
  }, [edges, selectedNodeId]);

  const selectedModule = useMemo(() => {
    return selectedNodeId ? moduleIntelligence[selectedNodeId] : null;
  }, [selectedNodeId]);

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case "high":
        return "bg-red-50 text-red-700 border border-red-100";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border border-yellow-100";
      case "low":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const formatRisk = (risk) => {
    if (!risk) {
      return "Unknown";
    }
    return risk.charAt(0).toUpperCase() + risk.slice(1);
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50"
    >
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {repoConfig.metrics.map((metric, idx) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="card-hover bg-white p-5 rounded-lg border border-slate-200 shadow-sm cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <Icon
                    name={metric.icon}
                    className={`${metric.iconColor} ${metric.iconBg} p-2 rounded-lg`}
                  />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 ${metric.badgeColor} rounded-full`}
                  >
                    {metric.badge}
                  </span>
                </div>
                <h3 className="text-xs font-medium text-slate-500 mb-1">
                  {metric.title}
                </h3>
                <p className="text-2xl font-bold text-slate-900">
                  {metric.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Architecture Graph + Inspector */}
          <div className="flex gap-6 h-[500px]">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-4 left-4 z-10">
                <h2 className="text-sm font-semibold text-slate-900">
                  Live Dependency Graph
                </h2>
                <p className="text-[11px] text-slate-400">
                  Cluster: production-aws-east
                </p>
              </div>

              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={() => setSimulateImpact(!simulateImpact)}
                  className={`text-xs font-semibold px-4 py-2 rounded shadow-sm button-smooth button-press flex items-center gap-2 transition-all ${
                    simulateImpact
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <Icon
                    name={simulateImpact ? "stop_circle" : "play_arrow"}
                    className="text-[16px]"
                  />
                  {simulateImpact ? "Stop Simulation" : "Simulate Impact"}
                </button>
              </div>

              <div className="flex-1 bg-slate-50 rounded-xl overflow-hidden">
                <ReactFlow
                  nodes={styledNodes}
                  edges={styledEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  onNodeDragStop={onNodeDragStop}
                  fitView
                  attributionPosition="bottom-right"
                  nodesDraggable={true}
                  nodesConnectable={false}
                  elementsSelectable={true}
                  panOnDrag={true}
                  zoomOnScroll={true}
                  panOnScroll={false}
                  minZoom={0.5}
                  maxZoom={2}
                  defaultEdgeOptions={{
                    type: "smoothstep",
                    animated: false,
                  }}
                  className="bg-slate-50"
                >
                  <Background
                    gap={20}
                    size={1}
                    color="#cbd5e1"
                    style={{ opacity: 0.3 }}
                  />
                  <Controls
                    showInteractive={false}
                    className="bg-white border border-slate-200 rounded-lg shadow-sm"
                  />
                  <MiniMap
                    nodeColor={(node) => {
                      switch (node.data.risk) {
                        case "high":
                          return "#ef4444";
                        case "medium":
                          return "#eab308";
                        case "low":
                          return "#10b981";
                        default:
                          return "#94a3b8";
                      }
                    }}
                    maskColor="rgba(248, 250, 252, 0.8)"
                    className="bg-white border border-slate-200 rounded-lg shadow-sm"
                  />
                </ReactFlow>
              </div>
            </div>

            <AnimatePresence>
              {selectedNode && (
                <motion.aside
                  initial={{ x: 380, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 380, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-slate-200 shadow-xl z-30 flex flex-col"
                >
                  <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Module Intelligence
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        Dependency Snapshot
                      </h3>
                    </div>
                    <button
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setSelectedNodeId(null)}
                    >
                      <Icon name="close" className="text-[18px]" />
                    </button>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Module Name
                      </p>
                      <h4 className="text-xl font-bold text-slate-900">
                        {selectedNode.data.label}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getRiskBadgeClass(
                          selectedNode.data.risk,
                        )}`}
                      >
                        {formatRisk(selectedNode.data.risk)} Risk
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Dependencies: {dependencyCount}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Dependency Count
                        </p>
                        <p className="text-2xl font-bold text-slate-900">
                          {dependencyCount}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          {simulateImpact ? "Impact Radius" : "Impact Score"}
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            simulateImpact ? "text-red-600" : "text-slate-900"
                          }`}
                        >
                          {simulateImpact
                            ? connectedNodes.length
                            : (selectedModule?.impact ?? 0)}
                        </p>
                        {simulateImpact && (
                          <p className="text-[10px] text-red-600 font-medium mt-1">
                            modules affected
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon
                          name="auto_awesome"
                          className="text-blue-600 text-[18px]"
                        />
                        <p className="text-[10px] font-bold uppercase text-slate-900">
                          AI Summary
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs leading-relaxed text-slate-700">
                        {selectedModule?.summary}
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>

          {/* Swarm Activity + AI Tutor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Swarm Activity */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Icon name="hub" className="text-[18px] text-blue-600" />
                  AI Swarm Activity
                </h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-medium text-slate-500">
                    Live
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {activityItems.map((item) => {
                  const isExpanded = expandedActivityId === item.id;
                  const relativeTime = formatRelativeTime(item.minutesAgo);
                  const getSeverityColor = (severity) => {
                    switch (severity) {
                      case "high":
                        return "bg-red-500";
                      case "medium":
                        return "bg-yellow-500";
                      case "low":
                        return "bg-emerald-500";
                      default:
                        return "bg-slate-400";
                    }
                  };

                  const getSeverityBadge = (severity) => {
                    switch (severity) {
                      case "high":
                        return "bg-red-50 text-red-700 border border-red-100";
                      case "medium":
                        return "bg-yellow-50 text-yellow-700 border border-yellow-100";
                      case "low":
                        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
                      default:
                        return "bg-slate-50 text-slate-600 border border-slate-200";
                    }
                  };

                  return (
                    <motion.div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer overflow-hidden"
                      onClick={() =>
                        setExpandedActivityId(isExpanded ? null : item.id)
                      }
                    >
                      <div className="p-3 flex gap-3">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${getSeverityColor(
                            item.severity,
                          )} mt-1 shrink-0`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <Icon
                                name={item.icon}
                                className="text-[16px] text-slate-600"
                              />
                              <span className="text-xs font-semibold text-slate-900">
                                {item.agent}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {relativeTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getSeverityBadge(
                                item.severity,
                              )}`}
                            >
                              {item.severity.charAt(0).toUpperCase() +
                                item.severity.slice(1)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-0 border-t border-slate-100 mt-2">
                              <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon
                                    name="info"
                                    className="text-[14px] text-blue-600"
                                  />
                                  <span className="text-[10px] font-bold uppercase text-slate-900">
                                    Detailed Analysis
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-700 leading-relaxed">
                                  {item.detailedExplanation}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* AI Tutor */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Icon name="school" className="text-[18px] text-blue-600" />
                  AI Tutor
                </h2>
                <button className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 transition-colors">
                  History
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-slate-900 text-slate-300 font-mono text-[11px] p-4 overflow-y-auto">
                  <div className="flex gap-4">
                    <span className="text-slate-600 text-right w-6 select-none">
                      1
                    </span>
                    <span>
                      <span className="text-blue-400">async function</span>{" "}
                      <span className="text-emerald-400">handleLogin</span>(req,
                      res) {"{"}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-slate-600 text-right w-6 select-none">
                      2
                    </span>
                    <span className="pl-4">
                      <span className="text-purple-400">const</span> {"{"} user,
                      pass {"}"} = req.body;
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-slate-600 text-right w-6 select-none">
                      3
                    </span>
                    <span className="pl-4 text-slate-500">
                      // Check authentication
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-slate-600 text-right w-6 select-none">
                      4
                    </span>
                    <span className="pl-4">
                      <span className="text-purple-400">if</span> (user && pass){" "}
                      {"{"}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-slate-600 text-right w-6 select-none">
                      5
                    </span>
                    <span className="pl-8 text-slate-500">...</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-slate-600 text-right w-6 select-none">
                      6
                    </span>
                    <span className="pl-4">{"}"}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-slate-600 text-right w-6 select-none">
                      7
                    </span>
                    <span>{"}"}</span>
                  </div>
                </div>

                <div className="w-1/2 border-l border-slate-200 p-5 bg-slate-50/30 overflow-y-auto flex flex-col">
                  <div className="pb-4 border-b border-slate-200 mb-4">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                      Powered by QuantumThread AI Swarm
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {tutorLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col items-center justify-center py-12"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-8 h-8 rounded-full bg-blue-600/20 border-2 border-blue-600 mb-3"
                          />
                          <p className="text-[11px] text-slate-600 font-medium">
                            AI thinking…
                          </p>
                        </motion.div>
                      ) : activeAction === "explain" && tutorResponse ? (
                        <motion.div
                          key="explain"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div>
                            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                              Purpose
                            </h4>
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {tutorResponse.purpose}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-200">
                            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                              Key Responsibilities
                            </h4>
                            <ul className="space-y-1.5">
                              {tutorResponse.responsibilities.map(
                                (item, idx) => (
                                  <li
                                    key={idx}
                                    className="flex gap-2 text-[11px] text-slate-700"
                                  >
                                    <span className="text-blue-600 font-bold">
                                      •
                                    </span>
                                    <span>{item}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                          <div className="pt-2 border-t border-slate-200">
                            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                              Risk Observations
                            </h4>
                            <ul className="space-y-1.5">
                              {tutorResponse.riskObservations.map(
                                (item, idx) => (
                                  <li
                                    key={idx}
                                    className="flex gap-2 text-[11px] text-red-700"
                                  >
                                    <span className="text-red-500 font-bold">
                                      ⚠
                                    </span>
                                    <span>{item}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </motion.div>
                      ) : activeAction === "flow" && tutorResponse ? (
                        <motion.div
                          key="flow"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-3">
                            Execution Flow
                          </h4>
                          {tutorResponse.map((item, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-[9px] font-bold text-blue-600">
                                  {item.step}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-900">
                                  {item.module}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 ml-8 mb-2">
                                {item.description}
                              </p>
                              {idx < tutorResponse.length - 1 && (
                                <div className="flex justify-center ml-3 mb-2">
                                  <Icon
                                    name="arrow_downward"
                                    className="text-slate-300 text-[16px]"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      ) : activeAction === "followup" &&
                        typeof tutorResponse === "string" ? (
                        <motion.div
                          key="followup"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-3"
                        >
                          <div className="p-3 bg-blue-50 rounded border border-blue-100">
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {tutorResponse}
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-900">
                            Architectural Logic
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
                            This function follows the{" "}
                            <span className="italic font-medium">
                              Controller Pattern
                            </span>
                            . To improve security, move the validation logic to
                            a separate{" "}
                            <span className="text-blue-600 underline">
                              AuthMiddleware
                            </span>{" "}
                            layer before reaching this handler.
                          </p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-4 space-y-3 border-t border-slate-200">
                    {activeAction === "followup" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <input
                          type="text"
                          value={followUpInput}
                          onChange={(e) => setFollowUpInput(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleFollowUp()
                          }
                          placeholder="Ask a follow-up question…"
                          className="w-full text-[11px] px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleFollowUp}
                          disabled={!followUpInput.trim()}
                          className="w-full bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send Question
                        </motion.button>
                      </motion.div>
                    )}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExplainFunction}
                        className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-2 rounded shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Icon name="menu_book" className="text-[16px]" />
                        Explain
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateFlow}
                        className="flex-1 bg-slate-900 text-white text-[10px] font-bold py-2 rounded shadow-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                      >
                        <Icon name="schema" className="text-[16px]" />
                        Flow
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveAction("followup");
                          setTutorResponse(null);
                        }}
                        className="flex-1 bg-slate-600 text-white text-[10px] font-bold py-2 rounded shadow-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Icon name="chat" className="text-[16px]" />
                        Ask
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.main>
  );
}

export default App;
