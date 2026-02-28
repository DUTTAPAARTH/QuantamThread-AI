import { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

const Icon = ({ name, className = "", style = {} }) => (
  <span className={`material-symbols-outlined ${className}`} style={style}>
    {name}
  </span>
);

const DepthBadgeNode = ({ data }) => (
  <div className="relative group">
    <Handle
      type="target"
      position={Position.Top}
      style={{ opacity: 0, pointerEvents: "none" }}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      style={{ opacity: 0, pointerEvents: "none" }}
    />
    <span>{data.label}</span>
    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 flex items-center justify-center pointer-events-none transition-opacity duration-200 opacity-75 group-hover:opacity-100">
      {data.depthLevel || "L0"}
    </span>
  </div>
);

// Repository configurations (shared with dashboard)
const repositoriesConfig = {
  "Quantum-Core": {
    name: "Quantum-Core",
    fullName: "quantum-core-v2",
    nodes: [
      {
        id: "1",
        position: { x: 250, y: 50 },
        data: { label: "Core API", risk: "high", load: 95, riskScore: 82 },
      },
      {
        id: "2",
        position: { x: 100, y: 200 },
        data: {
          label: "Event Stream",
          risk: "medium",
          load: 68,
          riskScore: 48,
        },
      },
      {
        id: "3",
        position: { x: 400, y: 200 },
        data: { label: "UI Shell", risk: "low", load: 45, riskScore: 35 },
      },
      {
        id: "4",
        position: { x: 250, y: 350 },
        data: { label: "Vector Store", risk: "low", load: 32, riskScore: 20 },
      },
      {
        id: "5",
        position: { x: 550, y: 120 },
        data: {
          label: "Auth Service",
          risk: "medium",
          load: 78,
          riskScore: 65,
        },
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
  },
  "Payment-Service": {
    name: "Payment-Service",
    fullName: "payment-service-api",
    nodes: [
      {
        id: "1",
        position: { x: 250, y: 50 },
        data: {
          label: "Payment Gateway",
          risk: "high",
          load: 92,
          riskScore: 88,
        },
      },
      {
        id: "2",
        position: { x: 100, y: 200 },
        data: {
          label: "Transaction Ledger",
          risk: "high",
          load: 85,
          riskScore: 85,
        },
      },
      {
        id: "3",
        position: { x: 400, y: 200 },
        data: {
          label: "Webhook Handler",
          risk: "medium",
          load: 56,
          riskScore: 58,
        },
      },
      {
        id: "4",
        position: { x: 250, y: 350 },
        data: {
          label: "Settlement Engine",
          risk: "high",
          load: 72,
          riskScore: 79,
        },
      },
      {
        id: "5",
        position: { x: 550, y: 120 },
        data: {
          label: "Card Processor",
          risk: "medium",
          load: 68,
          riskScore: 62,
        },
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
  },
};

// Module Intelligence Mock Data
const moduleIntelligence = {
  1: {
    name: "Core API",
    risk: "high",
    dependencies: 3,
    summary:
      "Primary gateway for service orchestration. Handles request shaping and routing across critical subsystems. Stability here directly influences uptime and latency budgets.",
    impactRadius: 4,
  },
  2: {
    name: "Event Stream",
    risk: "medium",
    dependencies: 2,
    summary:
      "Streams domain events into analytics and alerting pipelines. Recent updates improved throughput but added coupling.",
    impactRadius: 2,
  },
  3: {
    name: "UI Shell",
    risk: "low",
    dependencies: 2,
    summary:
      "Client interface container responsible for rendering modular views. Low risk but a common dependency for releases.",
    impactRadius: 1,
  },
  4: {
    name: "Vector Store",
    risk: "low",
    dependencies: 2,
    summary:
      "Vector embeddings store powering semantic search. Low risk surface area with predictable traffic patterns.",
    impactRadius: 1,
  },
  5: {
    name: "Auth Service",
    risk: "medium",
    dependencies: 1,
    summary:
      "Authentication boundary enforcing token validation and session integrity. Medium risk due to frequent policy updates.",
    impactRadius: 2,
  },
};

// Version Data - Mock risk scores for different versions
const versionData = {
  "Quantum-Core": {
    "v1.0": { 1: 40, 2: 30, 3: 20, 4: 15, 5: 35 },
    "v1.1": { 1: 55, 2: 38, 3: 25, 4: 18, 5: 45 },
    "v1.2": { 1: 70, 2: 50, 3: 30, 4: 25, 5: 60 },
    Current: { 1: 82, 2: 48, 3: 35, 4: 20, 5: 65 },
  },
  "Payment-Service": {
    "v1.0": { 1: 45, 2: 42, 3: 28, 4: 38, 5: 32 },
    "v1.1": { 1: 62, 2: 58, 3: 40, 4: 52, 5: 45 },
    "v1.2": { 1: 78, 2: 72, 3: 52, 4: 68, 5: 56 },
    Current: { 1: 88, 2: 85, 3: 58, 4: 79, 5: 62 },
  },
};

function ArchitectureMap() {
  const [selectedRepository, setSelectedRepository] = useState("Quantum-Core");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("Current");
  const [focusMode, setFocusMode] = useState(false);
  const [showHeatStrip, setShowHeatStrip] = useState(false);
  const [showGravityMap, setShowGravityMap] = useState(false);
  const [showEntropyRing, setShowEntropyRing] = useState(false);
  const [showBlastRadius, setShowBlastRadius] = useState(false);

  const repoConfig = repositoriesConfig[selectedRepository];
  const [nodes, setNodes, onNodesChange] = useNodesState(repoConfig.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(repoConfig.edges);
  const nodeTypes = useMemo(() => ({ depthBadgeNode: DepthBadgeNode }), []);

  // Update nodes when repository changes
  useEffect(() => {
    const newRepoConfig = repositoriesConfig[selectedRepository];
    setNodes(newRepoConfig.nodes);
    setEdges(newRepoConfig.edges);
  }, [selectedRepository, selectedBranch, setNodes, setEdges]);

  // Update node risk scores when version changes
  useEffect(() => {
    const versionRiskScores =
      versionData[selectedRepository]?.[selectedVersion];
    if (versionRiskScores) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            riskScore: versionRiskScores[node.id] || node.data.riskScore,
          },
        })),
      );
    }
  }, [selectedVersion, selectedRepository, setNodes]);

  useEffect(() => {
    console.log("ArchitectureMap edges:", edges);
    if (!edges || edges.length === 0) {
      console.warn("ArchitectureMap edges array is empty");
    }
  }, [edges]);

  // Style nodes based on risk level and selection
  const getHeatmapColor = useCallback((riskScore) => {
    if (riskScore >= 70) {
      // High risk: red tint, intensity increases with score
      const intensity = Math.min(100, riskScore) / 100;
      const bgOpacity = 0.1 + intensity * 0.15; // 0.1 to 0.25
      return {
        bg: `rgba(239, 68, 68, ${bgOpacity})`,
        border: `#dc2626`,
      };
    } else if (riskScore >= 35) {
      // Medium risk: yellow tint
      const intensity = (riskScore - 35) / 35;
      const bgOpacity = 0.1 + intensity * 0.15;
      return {
        bg: `rgba(217, 119, 6, ${bgOpacity})`,
        border: `#b45309`,
      };
    } else {
      // Low risk: green tint
      const intensity = riskScore / 35;
      const bgOpacity = 0.05 + intensity * 0.1;
      return {
        bg: `rgba(16, 185, 129, ${bgOpacity})`,
        border: `#059669`,
      };
    }
  }, []);

  // Style nodes based on risk level and selection
  const depthLevels = useMemo(() => {
    const incomingCount = nodes.reduce((accumulator, node) => {
      accumulator[node.id] = 0;
      return accumulator;
    }, {});

    const adjacency = nodes.reduce((accumulator, node) => {
      accumulator[node.id] = [];
      return accumulator;
    }, {});

    edges.forEach((edge) => {
      if (incomingCount[edge.target] !== undefined) {
        incomingCount[edge.target] += 1;
      }
      if (adjacency[edge.source]) {
        adjacency[edge.source].push(edge.target);
      }
    });

    const levels = {};
    const queue = [];

    Object.keys(incomingCount).forEach((nodeId) => {
      if (incomingCount[nodeId] === 0) {
        levels[nodeId] = 0;
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      const currentLevel = levels[currentNodeId] ?? 0;

      (adjacency[currentNodeId] || []).forEach((targetId) => {
        const nextLevel = Math.min(2, currentLevel + 1);
        if (levels[targetId] === undefined || nextLevel > levels[targetId]) {
          levels[targetId] = nextLevel;
          queue.push(targetId);
        }
      });
    }

    nodes.forEach((node) => {
      if (levels[node.id] === undefined) {
        levels[node.id] = 0;
      }
    });

    return levels;
  }, [nodes, edges]);

  // Style nodes based on risk level and selection
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      let borderColor = "#10b981"; // Green for low
      if (node.data.risk === "medium") borderColor = "#eab308"; // Yellow
      if (node.data.risk === "high") borderColor = "#ef4444"; // Red

      // Apply heatmap colors if enabled
      let bgColor = "white";
      if (heatmapEnabled && node.data.riskScore !== undefined) {
        const heatmapColor = getHeatmapColor(node.data.riskScore);
        bgColor = heatmapColor.bg;
        borderColor = heatmapColor.border;
      }

      const isSelected = node.id === selectedNodeId;

      // Focus mode: reduce opacity for non-selected nodes
      let nodeOpacity = focusMode && selectedNodeId && !isSelected ? 0.35 : 1;

      return {
        ...node,
        type: "depthBadgeNode",
        data: {
          ...node.data,
          depthLevel: `L${depthLevels[node.id] ?? 0}`,
        },
        style: {
          background: bgColor,
          border: isSelected ? `2px solid ${borderColor}` : `1px solid #e2e8f0`,
          borderLeft: `3px solid ${borderColor}`,
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: "600",
          opacity: nodeOpacity,
          boxShadow: isSelected
            ? `0 4px 12px ${borderColor}40`
            : "0 2px 6px rgba(0,0,0,0.05)",
          minWidth: "140px",
          transition:
            "all 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
        },
      };
    });
  }, [
    nodes,
    selectedNodeId,
    heatmapEnabled,
    getHeatmapColor,
    depthLevels,
    focusMode,
  ]);

  const styledEdges = useMemo(() => {
    const highRiskNodeIds = new Set(
      nodes
        .filter((node) => (node.data.riskScore ?? 0) >= 70)
        .map((node) => node.id),
    );

    return edges.map((edge) => {
      const connectedToHighRisk =
        highRiskNodeIds.has(edge.source) || highRiskNodeIds.has(edge.target);

      const strokeColor =
        heatmapEnabled && connectedToHighRisk ? "#64748b" : "#94a3b8";
      const strokeWidth = heatmapEnabled && connectedToHighRisk ? 1.9 : 1.5;

      return {
        ...edge,
        type: edge.type || "smoothstep",
        style: {
          ...(edge.style || {}),
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: "4 4",
          opacity: 1,
          transition: "stroke 0.2s ease, stroke-width 0.2s ease",
        },
      };
    });
  }, [edges, nodes, heatmapEnabled]);

  const onNodeDragStop = useCallback((event, node) => {
    console.log("Node dragged:", node);
  }, []);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const architectureSummary = useMemo(() => {
    const totalModules = nodes.length;
    const totalDependencyEdges = edges.length;

    const totalRiskScore = nodes.reduce(
      (sum, node) => sum + (node.data.riskScore ?? 0),
      0,
    );
    const averageRiskScore =
      totalModules > 0 ? Math.round(totalRiskScore / totalModules) : 0;

    const connectionCounts = nodes.reduce((accumulator, node) => {
      accumulator[node.id] = 0;
      return accumulator;
    }, {});

    edges.forEach((edge) => {
      if (connectionCounts[edge.source] !== undefined) {
        connectionCounts[edge.source] += 1;
      }
      if (connectionCounts[edge.target] !== undefined) {
        connectionCounts[edge.target] += 1;
      }
    });

    let mostConnectedNodeId = null;
    let highestConnections = -1;

    Object.entries(connectionCounts).forEach(([nodeId, count]) => {
      if (count > highestConnections) {
        highestConnections = count;
        mostConnectedNodeId = nodeId;
      }
    });

    const mostConnectedModule =
      nodes.find((node) => node.id === mostConnectedNodeId)?.data.label ||
      "N/A";

    return {
      totalModules,
      averageRiskScore,
      mostConnectedModule,
      totalDependencyEdges,
    };
  }, [nodes, edges]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-b border-slate-200 px-8 py-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Architecture Map
            </h1>
            <p className="text-sm text-slate-600">
              Interactive structural intelligence view of the selected
              repository.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Repository Selector */}
            <select
              value={selectedRepository}
              onChange={(e) => setSelectedRepository(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm font-medium bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {Object.keys(repositoriesConfig).map((repo) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>

            {/* Branch Badge */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 rounded-md text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <option value="main">main</option>
              <option value="staging">staging</option>
              <option value="feature-auth">feature-auth</option>
            </select>

            {/* Heatmap Toggle */}
            <button
              onClick={() => setHeatmapEnabled(!heatmapEnabled)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                heatmapEnabled
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Icon name="insights" className="text-[18px]" />
              <span>Heatmap</span>
            </button>

            {/* Focus Mode Toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                focusMode
                  ? "bg-purple-50 text-purple-600 border border-purple-200"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
              title="Focus on selected node and connected path"
            >
              <Icon name="center_focus_strong" className="text-[18px]" />
              <span>Focus</span>
            </button>

            {/* Intelligence Overlays Dropdown */}
            <div className="border-l border-slate-200 pl-3 ml-3 flex gap-2">
              <button
                onClick={() => setShowHeatStrip(!showHeatStrip)}
                className={`px-2 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  showHeatStrip
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
                title="Risk ranking heat strip"
              >
                Heat
              </button>
              <button
                onClick={() => setShowGravityMap(!showGravityMap)}
                className={`px-2 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  showGravityMap
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
                title="Gravity-based node sizing"
              >
                Gravity
              </button>
              <button
                onClick={() => setShowEntropyRing(!showEntropyRing)}
                className={`px-2 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  showEntropyRing
                    ? "bg-cyan-50 text-cyan-600 border border-cyan-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
                title="Entropy distribution ring"
              >
                Entropy
              </button>
              <button
                onClick={() => setShowBlastRadius(!showBlastRadius)}
                className={`px-2 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  showBlastRadius
                    ? "bg-orange-50 text-orange-600 border border-orange-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
                title="Impact blast radius projection"
              >
                Blast
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full-Width Graph Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 p-8 min-h-0 relative"
      >
        <div className="h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            attributionPosition="bottom-right"
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={true}
            panOnScroll={false}
            minZoom={0.3}
            maxZoom={2.5}
            defaultEdgeOptions={{
              type: "smoothstep",
              style: {
                stroke: "#94a3b8",
                strokeWidth: 1.5,
                strokeDasharray: "4 4",
              },
            }}
            className="bg-slate-50 relative z-0"
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

          {/* PHASE 3: Intelligence Overlays */}

          {/* Heat Strip: Risk-based cascade ranking */}
          {showHeatStrip && (
            <div className="absolute top-4 right-4 w-48 bg-white border border-slate-200 rounded-lg p-3 z-30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Risk Ranking
              </p>
              <div className="space-y-1">
                {nodes.slice(0, 5).map((node, idx) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-sm"
                      style={{
                        width: `${12 - idx * 2}px`,
                        backgroundColor:
                          idx === 0
                            ? "#ef4444"
                            : idx === 1
                              ? "#f97316"
                              : idx === 2
                                ? "#eab308"
                                : "#94a3b8",
                      }}
                    />
                    <span className="text-xs text-slate-600 truncate">
                      {node.data.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entropy Ring: Complexity distribution */}
          {showEntropyRing && (
            <svg
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
              width="300"
              height="300"
              style={{ opacity: 0.4 }}
            >
              <circle
                cx="150"
                cy="150"
                r="100"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
              />
              <circle
                cx="150"
                cy="150"
                r="120"
                fill="none"
                stroke="#0891b2"
                strokeWidth="1"
              />
              <circle
                cx="150"
                cy="150"
                r="80"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </svg>
          )}

          {/* Blast Radius Arcs: Impact zones */}
          {showBlastRadius && (
            <svg
              className="absolute inset-0 pointer-events-none z-5"
              width="100%"
              height="100%"
              style={{ opacity: 0.25 }}
            >
              <defs>
                <filter id="blastGlow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                </filter>
              </defs>
              {nodes.map((node) => {
                const radius = (node.data.riskScore ?? 0) / 10;
                return (
                  <circle
                    key={node.id}
                    cx={node.position?.x || 0}
                    cy={node.position?.y || 0}
                    r={radius}
                    fill="none"
                    stroke={
                      node.data.risk === "high"
                        ? "#ef4444"
                        : node.data.risk === "medium"
                          ? "#eab308"
                          : "#10b981"
                    }
                    strokeWidth="1"
                    opacity="0.3"
                    style={{ transition: "opacity 0.15s ease" }}
                  />
                );
              })}
            </svg>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-4 w-[260px] bg-white border border-[#e2e8f0] shadow-sm rounded-lg p-4 z-30 pointer-events-none"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Architecture Summary
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Modules</span>
                <span className="text-sm font-semibold text-slate-900">
                  {architectureSummary.totalModules}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Average Risk Score
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {architectureSummary.averageRiskScore}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Most Connected Module
                </span>
                <span className="text-sm font-semibold text-slate-900 text-right">
                  {architectureSummary.mostConnectedModule}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Total Dependency Edges
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {architectureSummary.totalDependencyEdges}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Evolution Timeline Slider */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Icon name="history" className="text-slate-400 text-[20px]" />
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Evolution Timeline
                </span>
              </div>

              {/* Version Selector */}
              <div className="flex-1 flex items-center gap-4">
                {["v1.0", "v1.1", "v1.2", "Current"].map((version, idx) => (
                  <button
                    key={version}
                    onClick={() => setSelectedVersion(version)}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedVersion === version
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {version}
                  </button>
                ))}
              </div>

              {/* Version Info */}
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                  Selected
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedVersion}
                </p>
              </div>
            </div>
          </div>

          {/* Module Inspector Panel - Overlay */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute right-0 top-0 h-full w-[400px] bg-white border-l border-slate-200 shadow-lg z-40 flex flex-col overflow-hidden"
              >
                {/* Panel Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Module Inspector
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selectedNode.data.label}
                    </h3>
                  </div>
                  <button
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    onClick={() => setSelectedNodeId(null)}
                  >
                    <Icon name="close" className="text-[20px]" />
                  </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Risk Score */}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                      Risk Score
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-slate-900">
                        {selectedNode.data.riskScore ?? 0}
                      </span>
                      <span className="text-xs text-slate-500">/ 100</span>
                    </div>
                  </div>

                  {/* Dependencies */}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                      Dependencies
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {moduleIntelligence[selectedNodeId]?.dependencies || 0}
                    </p>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                      AI Summary
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {moduleIntelligence[selectedNodeId]?.summary}
                    </p>
                  </div>

                  {/* Impact Radius */}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                      Impact Radius
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-blue-600">
                        {moduleIntelligence[selectedNodeId]?.impactRadius || 0}
                      </span>
                      <span className="text-xs text-slate-600">
                        modules affected
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default ArchitectureMap;
