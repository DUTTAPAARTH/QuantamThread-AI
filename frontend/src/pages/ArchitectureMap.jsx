import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchArchitecture } from "../api";

/* ─── Design tokens ────────────────────────────────────────────────────────── */
const darkBg = "#0B0F1A";
const glass = {
  background: "rgba(26,31,46,0.75)",
  backdropFilter: "blur(16px) saturate(130%)",
  WebkitBackdropFilter: "blur(16px) saturate(130%)",
};

const RISK_COLOR = { high: "#ef4444", medium: "#eab308", low: "#10b981" };
const RISK_GLOW  = { high: "rgba(239,68,68,0.35)", medium: "rgba(234,179,8,0.35)", low: "rgba(16,185,129,0.35)" };
const RISK_BG    = { high: "rgba(239,68,68,0.08)", medium: "rgba(234,179,8,0.08)", low: "rgba(16,185,129,0.06)" };

const Icon = ({ name, className = "", style = {} }) => (
  <span className={`material-symbols-outlined ${className}`} style={style}>{name}</span>
);

/* ─── Node sizing helpers ───────────────────────────────────────────────────── */
const NODE_W = 160;
const NODE_H = 56;

function nodeCenter(node) {
  return { x: (node.position?.x ?? 100) + NODE_W / 2, y: (node.position?.y ?? 100) + NODE_H / 2 };
}

/* ─── Edge path between two nodes ──────────────────────────────────────────── */
function edgePath(src, tgt) {
  const s = nodeCenter(src);
  const t = nodeCenter(tgt);
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const cx1 = s.x + dx * 0.25;
  const cy1 = s.y + dy * 0.0 + (dy > 0 ? 60 : -60);
  const cx2 = t.x - dx * 0.25;
  const cy2 = t.y - dy * 0.0 - (dy > 0 ? 60 : -60);
  return `M ${s.x} ${s.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t.x} ${t.y}`;
}

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function ArchitectureMap() {
  const { selectedProject } = useOutletContext();
  const repo = selectedProject?.name || "";

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [heatmap, setHeatmap] = useState(false);
  const [dragging, setDragging] = useState(null); // { nodeId, offsetX, offsetY }
  const [positions, setPositions] = useState({}); // override positions while dragging
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const svgRef = useRef(null);

  /* ── Fetch architecture data ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!repo) { setNodes([]); setEdges([]); setError(null); return; }
    setLoading(true);
    setError(null);
    setSelectedNodeId(null);
    setPositions({});

    fetchArchitecture(repo)
      .then((data) => {
        const rawNodes = data.nodes || [];
        const rawEdges = data.edges || [];
        console.log(`[ArchMap] ${rawNodes.length} nodes, ${rawEdges.length} edges`);

        // Normalise edges — ensure source/target are strings matching node IDs
        const nodeIds = new Set(rawNodes.map((n) => String(n.id)));
        const validEdges = rawEdges
          .map((e) => ({ ...e, source: String(e.source), target: String(e.target) }))
          .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target) && e.source !== e.target);

        // Deduplicate edges
        const seen = new Set();
        const dedupedEdges = validEdges.filter((e) => {
          const k = `${e.source}→${e.target}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        setNodes(rawNodes.map((n) => ({ ...n, id: String(n.id) })));
        setEdges(dedupedEdges);
      })
      .catch((err) => {
        console.error("[ArchMap] fetch error:", err);
        setError(err.message || "Failed to load architecture");
      })
      .finally(() => setLoading(false));
  }, [repo]);

  /* ── Effective node positions (drag overrides + base positions) ──────────── */
  const effectiveNodes = useMemo(
    () => nodes.map((n) => ({
      ...n,
      position: positions[n.id] ?? n.position ?? { x: 100, y: 100 },
    })),
    [nodes, positions]
  );

  const nodeById = useMemo(
    () => Object.fromEntries(effectiveNodes.map((n) => [n.id, n])),
    [effectiveNodes]
  );

  const selectedNode = nodeById[selectedNodeId] || null;

  /* ── SVG viewport bounds ─────────────────────────────────────────────────── */
  const svgBounds = useMemo(() => {
    if (effectiveNodes.length === 0) return { minX: 0, minY: 0, maxX: 900, maxY: 600 };
    const xs = effectiveNodes.map((n) => n.position.x);
    const ys = effectiveNodes.map((n) => n.position.y);
    return {
      minX: Math.min(...xs) - 80,
      minY: Math.min(...ys) - 80,
      maxX: Math.max(...xs) + NODE_W + 80,
      maxY: Math.max(...ys) + NODE_H + 80,
    };
  }, [effectiveNodes]);

  const vbWidth  = (svgBounds.maxX - svgBounds.minX);
  const vbHeight = (svgBounds.maxY - svgBounds.minY);

  /* ── Drag handling ───────────────────────────────────────────────────────── */
  const onNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = vbWidth / rect.width;
    const svgX = (e.clientX - rect.left) * scale + svgBounds.minX;
    const svgY = (e.clientY - rect.top)  * scale + svgBounds.minY;
    const node = effectiveNodes.find((n) => n.id === nodeId);
    setDragging({ nodeId, offsetX: svgX - node.position.x, offsetY: svgY - node.position.y });
    setSelectedNodeId(nodeId);
  }, [effectiveNodes, svgBounds, vbWidth]);

  const onSvgMouseMove = useCallback((e) => {
    if (dragging) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scale = vbWidth / rect.width;
      const svgX = (e.clientX - rect.left) * scale + svgBounds.minX;
      const svgY = (e.clientY - rect.top)  * scale + svgBounds.minY;
      setPositions((prev) => ({
        ...prev,
        [dragging.nodeId]: { x: svgX - dragging.offsetX, y: svgY - dragging.offsetY },
      }));
    } else if (isPanning && panStart.current) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scale = vbWidth / rect.width;
      const dx = (e.clientX - panStart.current.clientX) * scale;
      const dy = (e.clientY - panStart.current.clientY) * scale;
      setViewBox((prev) => ({ ...prev, x: panStart.current.vbX - dx, y: panStart.current.vbY - dy }));
    }
  }, [dragging, isPanning, svgBounds, vbWidth]);

  const onSvgMouseUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const onSvgMouseDown = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      setSelectedNodeId(null);
      setIsPanning(true);
      panStart.current = { clientX: e.clientX, clientY: e.clientY, vbX: viewBox.x, vbY: viewBox.y };
    }
  }, [viewBox]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setViewBox((prev) => {
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      return { ...prev, scale: Math.max(0.3, Math.min(3, prev.scale * factor)) };
    });
  }, []);

  /* ── Edge connection count per node ─────────────────────────────────────── */
  const connectionCount = useMemo(() => {
    const count = {};
    edges.forEach((e) => {
      count[e.source] = (count[e.source] || 0) + 1;
      count[e.target] = (count[e.target] || 0) + 1;
    });
    return count;
  }, [edges]);

  const connectedToSelected = useMemo(() => {
    if (!selectedNodeId) return new Set();
    const set = new Set();
    edges.forEach((e) => {
      if (e.source === selectedNodeId) set.add(e.target);
      if (e.target === selectedNodeId) set.add(e.source);
    });
    return set;
  }, [edges, selectedNodeId]);

  /* ── Summary stats ───────────────────────────────────────────────────────── */
  const summary = useMemo(() => {
    const highRisk = effectiveNodes.filter((n) => n.data?.risk === "high").length;
    const avgRisk = effectiveNodes.length
      ? Math.round(effectiveNodes.reduce((s, n) => s + (n.data?.riskScore ?? 0), 0) / effectiveNodes.length)
      : 0;
    const mostConnected = Object.entries(connectionCount).sort((a, b) => b[1] - a[1])[0];
    const mcNode = mostConnected ? nodeById[mostConnected[0]] : null;
    return { total: effectiveNodes.length, highRisk, avgRisk, edgeCount: edges.length, mostConnected: mcNode?.data?.label ?? "—" };
  }, [effectiveNodes, edges, connectionCount, nodeById]);

  /* ── Render ──────────────────────────────────────────────────────────────── */
  const finalVbX = svgBounds.minX + viewBox.x;
  const finalVbY = svgBounds.minY + viewBox.y;
  const finalVbW = vbWidth  / viewBox.scale;
  const finalVbH = vbHeight / viewBox.scale;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: darkBg }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/[0.06] px-8 py-5 shrink-0 flex items-center justify-between"
        style={{ ...glass, boxShadow: "0 1px 0 rgba(255,255,255,0.03)" }}
      >
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon name="account_tree" className="text-indigo-400 text-[22px]" />
            Architecture Map
            {repo && <span className="text-sm font-normal text-slate-400 ml-2">— {repo}</span>}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-analyzed dependency graph · drag nodes · scroll to zoom
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Heatmap toggle */}
          <button
            onClick={() => setHeatmap((h) => !h)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              heatmap
                ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
                : "bg-white/[0.05] text-slate-400 border-white/[0.06] hover:bg-white/[0.08]"
            }`}
          >
            <Icon name="local_fire_department" className="text-base" />
            Risk Heatmap
          </button>

          {/* Fit view */}
          <button
            onClick={() => { setViewBox({ x: 0, y: 0, scale: 1 }); setPositions({}); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white/[0.05] text-slate-400 border-white/[0.06] hover:bg-white/[0.08] transition-all"
            title="Reset view"
          >
            <Icon name="fit_screen" className="text-base" />
            Fit
          </button>
        </div>
      </motion.div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Canvas ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 relative min-h-0 overflow-hidden">

          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin mb-4" />
              <p className="text-sm text-slate-400">AI is analyzing architecture…</p>
              <p className="text-xs text-slate-600 mt-1">Scanning imports, modules, and dependencies</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <Icon name="error_outline" className="text-red-400 text-5xl mb-3" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
              <p className="text-xs text-slate-500 mt-1">Check the backend logs for details</p>
            </div>
          )}

          {/* No project */}
          {!loading && !error && !repo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3">
              <Icon name="account_tree" className="text-slate-600 text-6xl" />
              <p className="text-slate-500 text-sm">Select a project to view its architecture</p>
            </div>
          )}

          {/* No data yet (project selected but analysis pending) */}
          {!loading && !error && repo && nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3">
              <Icon name="hourglass_top" className="text-indigo-400 text-5xl" />
              <p className="text-slate-400 text-sm font-medium">Architecture analysis in progress…</p>
              <p className="text-slate-600 text-xs">Re-analyze the project when it finishes</p>
            </div>
          )}

          {/* SVG graph */}
          {!loading && nodes.length > 0 && (
            <svg
              ref={svgRef}
              className="w-full h-full select-none"
              viewBox={`${finalVbX} ${finalVbY} ${finalVbW} ${finalVbH}`}
              onMouseMove={onSvgMouseMove}
              onMouseUp={onSvgMouseUp}
              onMouseLeave={onSvgMouseUp}
              onMouseDown={onSvgMouseDown}
              onWheel={onWheel}
              style={{ cursor: dragging ? "grabbing" : isPanning ? "grabbing" : "grab", background: "radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.04) 0%, transparent 70%)" }}
            >
              {/* Grid dots */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(148,163,184,0.12)" />
                </pattern>
                {/* Arrow marker */}
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(139,92,246,0.7)" />
                </marker>
                <marker id="arrow-animated" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
                </marker>
                {/* Glow filters */}
                <filter id="glow-high">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect x={svgBounds.minX - 2000} y={svgBounds.minY - 2000} width={vbWidth + 4000} height={vbHeight + 4000} fill="url(#grid)" />

              {/* ── Edges ──────────────────────────────────────────────────── */}
              <g>
                {edges.map((edge) => {
                  const src = nodeById[edge.source];
                  const tgt = nodeById[edge.target];
                  if (!src || !tgt) return null;
                  const d = edgePath(src, tgt);
                  const isRelated = selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
                  const isOtherSelected = selectedNodeId && !isRelated;
                  const strokeColor = edge.animated ? "#a78bfa" : "rgba(139,92,246,0.55)";
                  return (
                    <g key={edge.id}>
                      <path
                        d={d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isRelated ? 2.5 : 1.5}
                        strokeDasharray={edge.animated ? "8 4" : undefined}
                        opacity={isOtherSelected ? 0.15 : 1}
                        markerEnd={`url(#${edge.animated ? "arrow-animated" : "arrow"})`}
                        style={{ transition: "opacity 0.2s, stroke-width 0.2s" }}
                      />
                      {edge.label && isRelated && (
                        <text
                          x={(nodeCenter(src).x + nodeCenter(tgt).x) / 2}
                          y={(nodeCenter(src).y + nodeCenter(tgt).y) / 2 - 8}
                          textAnchor="middle"
                          fontSize="10"
                          fill="rgba(148,163,184,0.8)"
                          style={{ pointerEvents: "none" }}
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* ── Nodes ──────────────────────────────────────────────────── */}
              <g>
                {effectiveNodes.map((node) => {
                  const { x, y } = node.position;
                  const risk = node.data?.risk || "low";
                  const riskScore = node.data?.riskScore ?? 0;
                  const label = node.data?.label || node.id;
                  const load = node.data?.load ?? 0;
                  const isSelected = node.id === selectedNodeId;
                  const isConnected = connectedToSelected.has(node.id);
                  const isOther = selectedNodeId && !isSelected && !isConnected;
                  const borderColor = heatmap
                    ? (riskScore >= 70 ? "#ef4444" : riskScore >= 35 ? "#eab308" : "#10b981")
                    : RISK_COLOR[risk];
                  const bgColor = heatmap ? RISK_BG[risk] : "rgba(13,17,23,0.82)";

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${x}, ${y})`}
                      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                      style={{ cursor: "grab", opacity: isOther ? 0.3 : 1, transition: "opacity 0.2s" }}
                    >
                      {/* Selection glow ring */}
                      {isSelected && (
                        <rect
                          x={-4} y={-4}
                          width={NODE_W + 8} height={NODE_H + 8}
                          rx={12}
                          fill="none"
                          stroke={borderColor}
                          strokeWidth={2}
                          opacity={0.6}
                          filter="url(#glow-high)"
                        />
                      )}

                      {/* Node body */}
                      <rect
                        x={0} y={0}
                        width={NODE_W} height={NODE_H}
                        rx={8}
                        fill={bgColor}
                        stroke={isSelected ? borderColor : "rgba(255,255,255,0.08)"}
                        strokeWidth={isSelected ? 2 : 1}
                      />

                      {/* Risk accent bar (left edge) */}
                      <rect x={0} y={0} width={3} height={NODE_H} rx={2} fill={borderColor} />

                      {/* Load indicator bar (bottom) */}
                      <rect
                        x={4} y={NODE_H - 4}
                        width={Math.max(0, (NODE_W - 8) * (load / 100))}
                        height={3}
                        rx={1.5}
                        fill={borderColor}
                        opacity={0.4}
                      />

                      {/* Label */}
                      <text
                        x={NODE_W / 2 + 4}
                        y={NODE_H / 2 - 4}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#e2e8f0"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {label.length > 18 ? label.slice(0, 16) + "…" : label}
                      </text>

                      {/* Risk badge */}
                      <text
                        x={NODE_W / 2 + 4}
                        y={NODE_H / 2 + 10}
                        textAnchor="middle"
                        fontSize="9"
                        fill={borderColor}
                        opacity={0.85}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {risk.toUpperCase()} · {riskScore}/100
                      </text>

                      {/* Connection count badge */}
                      {(connectionCount[node.id] || 0) > 0 && (
                        <g>
                          <circle cx={NODE_W - 2} cy={4} r={9} fill="rgba(11,15,26,0.9)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                          <text x={NODE_W - 2} y={8} textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8" style={{ pointerEvents: "none" }}>
                            {connectionCount[node.id]}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* ── Summary overlay (top-left) ──────────────────────────────────── */}
          {nodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 left-4 rounded-xl border border-white/[0.06] p-4 w-52 pointer-events-none"
              style={{ ...glass }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">Architecture Summary</p>
              {[
                { label: "Components", value: summary.total },
                { label: "Dependencies", value: summary.edgeCount },
                { label: "High Risk", value: summary.highRisk, accent: summary.highRisk > 0 ? "#ef4444" : undefined },
                { label: "Avg Risk Score", value: `${summary.avgRisk}/100` },
                { label: "Most Connected", value: summary.mostConnected },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-bold" style={{ color: accent || "#e2e8f0" }}>{value}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── Legend (bottom-left) ────────────────────────────────────────── */}
          {nodes.length > 0 && (
            <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.06]" style={{ ...glass }}>
              {["high", "medium", "low"].map((r) => (
                <div key={r} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLOR[r] }} />
                  <span className="text-[10px] text-slate-400 capitalize">{r}</span>
                </div>
              ))}
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <svg width="18" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
                <span className="text-[10px] text-slate-400">Animated = high-risk</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Node Inspector Panel ─────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.aside
              key="inspector"
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-72 shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden"
              style={{ ...glass }}
            >
              {/* Header */}
              <div className="p-5 border-b border-white/[0.06] flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Module Inspector</p>
                  <h3 className="text-base font-bold text-white leading-tight">{selectedNode.data?.label}</h3>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
                >
                  <Icon name="close" className="text-lg" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* Risk score */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Risk Score</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold" style={{ color: RISK_COLOR[selectedNode.data?.risk] }}>
                      {selectedNode.data?.riskScore ?? 0}
                    </span>
                    <span className="text-slate-500 text-sm mb-1">/ 100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedNode.data?.riskScore ?? 0}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: RISK_COLOR[selectedNode.data?.risk] }}
                    />
                  </div>
                </div>

                {/* Load */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">CPU/Load</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedNode.data?.load ?? 0}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-indigo-500"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300">{selectedNode.data?.load ?? 0}%</span>
                  </div>
                </div>

                {/* Connections */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Connections</p>
                  <p className="text-2xl font-bold text-white">{connectionCount[selectedNodeId] || 0}</p>
                  <div className="mt-2 space-y-1">
                    {edges
                      .filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
                      .slice(0, 6)
                      .map((e) => {
                        const otherId = e.source === selectedNodeId ? e.target : e.source;
                        const other = nodeById[otherId];
                        const dir = e.source === selectedNodeId ? "→" : "←";
                        return (
                          <div key={e.id} className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="text-indigo-400 font-bold">{dir}</span>
                            <span className="truncate">{other?.data?.label || otherId}</span>
                            {e.label && <span className="text-slate-600 text-[10px]">({e.label})</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* AI description */}
                {selectedNode.data?.description && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">AI Analysis</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.data.description}</p>
                  </div>
                )}

                {/* Risk level badge */}
                <div
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-center"
                  style={{
                    background: RISK_BG[selectedNode.data?.risk],
                    color: RISK_COLOR[selectedNode.data?.risk],
                    border: `1px solid ${RISK_GLOW[selectedNode.data?.risk]}`,
                  }}
                >
                  {selectedNode.data?.risk?.toUpperCase()} RISK
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
