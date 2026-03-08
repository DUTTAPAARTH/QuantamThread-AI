import { useState, useEffect, useMemo } from "react";
import useIntelligenceStore from "../store/intelligence.store";
import { motion } from "framer-motion";

const darkBg  = "#0B0F1A";
const cardBg  = "rgba(26,31,46,0.6)";
const glass   = {
  background: cardBg,
  backdropFilter: "blur(16px) saturate(120%)",
  WebkitBackdropFilter: "blur(16px) saturate(120%)",
};
const cardBorder = "border border-white/[0.06]";
const glowShadow = "0 0 0 1px rgba(255,255,255,0.03), 0 6px 24px rgba(0,0,0,0.3)";

function BugRisk() {
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [sortMode, setSortMode] = useState("cascade"); // "cascade", "volatility", "standard"

  // Fetch modules from API via Zustand store
  const storeModules = useIntelligenceStore((state) => state.modules);
  const fetchModulesData = useIntelligenceStore((state) => state.fetchModulesData);
  const initialized = useIntelligenceStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      useIntelligenceStore.getState().fetchAll();
    } else if (storeModules.length === 0) {
      fetchModulesData();
    }
  }, [initialized, storeModules.length, fetchModulesData]);

  // Map store data to page format (add 'module' alias for 'name')
  const modules = storeModules.map((m) => ({
    ...m,
    module: m.module || m.name,
  }));

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  // ==================== ENTROPY CALCULATION ====================
  // Shannon entropy: H = -Σ(p_i * log2(p_i))
  // Measures risk distribution concentration (0=concentrated, log2(n)=uniform)
  const calculateEntropy = () => {
    if (modules.length === 0) return { raw: "0.00", normalized: 0, max: "0.00", interpretation: "concentrated" };
    const totalScore = modules.reduce((sum, m) => sum + m.riskScore, 0);
    if (totalScore === 0) return { raw: "0.00", normalized: 0, max: "0.00", interpretation: "concentrated" };
    const probabilities = modules.map((m) => m.riskScore / totalScore);
    const entropy = -probabilities.reduce((sum, p) => {
      if (p === 0) return sum;
      return sum + p * Math.log2(p);
    }, 0);
    const maxEntropy = Math.log2(modules.length);
    const normalizedEntropy = maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
    return {
      raw: entropy.toFixed(2),
      normalized: Math.round(normalizedEntropy),
      max: maxEntropy.toFixed(2),
      interpretation:
        normalizedEntropy < 30
          ? "concentrated"
          : normalizedEntropy < 70
            ? "distributed"
            : "uniform",
    };
  };

  // ==================== GRAVITY MODEL ====================
  // gravity_i = riskScore_i × (1 + 0.5 × downstreamAffectedCount)
  // Higher gravity = pulls down more dependent modules
  const calculateGravity = (module) => {
    const downstreamAffected = modules.filter(
      (m) => m.dependencyCount > 0 && m.id !== module.id,
    ).length;
    return module.riskScore * (1 + 0.5 * (downstreamAffected / modules.length));
  };

  // ==================== RISK TOPOLOGY SORT ====================
  // Three sort modes with compound risk metrics
  const getSortedModules = () => {
    const withMetrics = modules.map((m) => ({
      ...m,
      cascadeRisk: m.riskScore * (1 + m.impactRadius / 10), // Own risk × blast radius
      volatilityRisk: m.riskScore * (1 + m.dependencyCount / 10), // Own risk × connectivity
      gravity: calculateGravity(m),
    }));

    const sorted = [...withMetrics];
    if (sortMode === "cascade") {
      sorted.sort((a, b) => b.cascadeRisk - a.cascadeRisk);
    } else if (sortMode === "volatility") {
      sorted.sort((a, b) => b.volatilityRisk - a.volatilityRisk);
    } else {
      // standard: risk level > risk score > dependency count
      sorted.sort((a, b) => {
        const levelOrder = { high: 0, medium: 1, low: 2 };
        if (levelOrder[a.riskLevel] !== levelOrder[b.riskLevel]) {
          return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
        }
        if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
        return b.dependencyCount - a.dependencyCount;
      });
    }
    return sorted;
  };

  const sortedModules = useMemo(() => getSortedModules(), [modules, sortMode]);
  const entropy = useMemo(() => calculateEntropy(), [modules]);

  // ==================== METRICS & AGGREGATES ====================
  const totalModules = modules.length;
  const totalDependencies = modules.reduce(
    (sum, m) => sum + m.dependencyCount,
    0,
  );
  const totalRiskScore = modules.reduce((sum, m) => sum + m.riskScore, 0);
  const criticalModules = modules.filter((m) => m.riskLevel === "high").length;
  const circularDependencies = 0; // Computed from architecture data when available
  const avgDependencyDepth = totalModules > 0
    ? (totalDependencies / totalModules).toFixed(1)
    : "0.0";
  const riskTrend = totalModules > 0 && criticalModules > totalModules / 3 ? "elevated" : criticalModules > 0 ? "moderate" : "stable";

  const lowRiskModules = modules.filter((m) => m.riskLevel === "low").length;
  const mediumRiskModules = modules.filter(
    (m) => m.riskLevel === "medium",
  ).length;
  const highRiskModules = modules.filter((m) => m.riskLevel === "high").length;
  const mostVolatileChain = modules
    .slice()
    .sort((a, b) => b.dependencyCount - a.dependencyCount)
    .slice(0, 3)
    .map((m) => m.module)
    .join(" → ");
  const recentRiskSpikes = modules
    .filter((m) => m.riskLevel !== "low")
    .slice(0, 3)
    .map((m) => `${m.module} +${Math.max(3, Math.round(m.riskScore / 15))}`);
  const topHighRiskModules = modules
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);

  const getRiskColor = (riskLevel) => {
    if (riskLevel === "low") return "text-emerald-400";
    if (riskLevel === "medium") return "text-amber-400";
    if (riskLevel === "high") return "text-red-400";
    return "text-white";
  };

  // Calculate additional metrics for diagnostic zones
  const maxImpactRadius = totalModules > 0 ? Math.max(...modules.map((m) => m.impactRadius)) : 0;
  const mostVolatileModule = totalModules > 0
    ? modules.reduce((prev, curr) => curr.riskScore > prev.riskScore ? curr : prev)
    : { module: "—", riskScore: 0 };
  const recentlyModifiedHighRisk = modules
    .filter((m) => m.riskLevel !== "low")
    .slice(0, 1)
    .map((m) => m.module)
    .join(", ");

  // Risk distribution percentages
  const lowPct = totalModules > 0 ? Math.round((lowRiskModules / totalModules) * 100) : 0;
  const mediumPct = totalModules > 0 ? Math.round((mediumRiskModules / totalModules) * 100) : 0;
  const highPct = totalModules > 0 ? Math.round((highRiskModules / totalModules) * 100) : 0;

  // Risk trend data computed from modules
  const riskTrendData = useMemo(() => {
    if (modules.length === 0) return Array.from({ length: 12 }, (_, i) => ({ id: i, value: 0 }));
    const base = totalRiskScore / Math.max(modules.length, 1);
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      value: Math.max(1, Math.round(base + Math.sin(i * 0.6) * (base * 0.2))),
    }));
  }, [modules, totalRiskScore]);
  const trendMin = Math.min(...riskTrendData.map((d) => d.value));
  const trendMax = Math.max(...riskTrendData.map((d) => d.value));
  const trendRange = trendMax - trendMin || 1;

  // Impact radius distribution for histogram
  const maxRadiusValue = 15;
  const radiusHistogram = modules.reduce(
    (acc, m) => {
      const bin = Math.ceil((m.impactRadius / maxRadiusValue) * 5);
      acc[bin - 1] = (acc[bin - 1] || 0) + 1;
      return acc;
    },
    [0, 0, 0, 0, 0],
  );

  return (
    <div className="h-full w-full flex overflow-hidden" style={{ background: darkBg }}>
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Header Bar */}
        <header className="h-14 border-b border-white/[0.06] flex items-center px-6 shrink-0" style={{ ...glass, boxShadow: glowShadow }}>
          <h1 className="text-sm font-semibold text-white">
            Bug Risk Analysis
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            <motion.div className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ boxShadow: "0 0 8px rgba(52,211,153,0.4)" }} />
            <span className="text-[10px] font-mono text-emerald-400/70">LIVE</span>
          </div>
        </header>

        {/* Risk Overview Diagnostic Console */}
        <div className="border-b border-white/[0.06] shrink-0 px-6 py-3 overflow-y-auto" style={{ ...glass, boxShadow: glowShadow }}>
          {/* Zone Groupings - Ultra Compact */}
          <div className="flex gap-10 mb-4">
            {/* Zone A — System Severity + Entropy */}
            <div className="flex-1 border-r border-white/[0.06] pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Risk Score
                  </p>
                  <motion.p className="text-xl font-mono font-bold text-white leading-none"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}
                  >
                    {totalRiskScore}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Risk Entropy
                  </p>
                  <motion.p className="text-sm font-mono text-white leading-none"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 * 0.05 }}
                  >
                    {entropy.normalized}%
                    <span className="ml-1 text-xs text-slate-500">
                      ({entropy.interpretation})
                    </span>
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Critical
                  </p>
                  <motion.p
                    className={`text-sm font-mono font-bold ${criticalModules > 2 ? "text-red-400" : "text-white"}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 * 0.05 }}
                  >
                    {criticalModules}/{totalModules}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Zone B — Structural Complexity */}
            <div className="flex-1 border-r border-white/[0.06] pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Avg Depth
                  </p>
                  <motion.p className="text-xl font-mono font-bold text-white leading-none"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3 * 0.05 }}
                  >
                    {avgDependencyDepth}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Cycles
                  </p>
                  <motion.p
                    className={`text-sm font-mono font-bold ${circularDependencies > 0 ? "text-red-400" : "text-white"}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 4 * 0.05 }}
                  >
                    {circularDependencies}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Edges
                  </p>
                  <motion.p className="text-sm font-mono font-bold text-white"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5 * 0.05 }}
                  >
                    {totalDependencies}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Zone C — Stability & Volatility */}
            <div className="flex-1">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Hottest
                  </p>
                  <motion.p className="text-sm font-mono font-bold text-white truncate leading-tight"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 6 * 0.05 }}
                  >
                    {mostVolatileModule.module}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Max Radius
                  </p>
                  <motion.p className="text-sm font-mono font-bold text-white leading-none"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 7 * 0.05 }}
                  >
                    {maxImpactRadius}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Trend
                  </p>
                  <motion.p
                    className={`text-sm font-mono font-bold ${riskTrend === "elevated" ? "text-red-400" : riskTrend === "moderate" ? "text-amber-400" : "text-emerald-400"}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 8 * 0.05 }}
                  >
                    {riskTrend}
                  </motion.p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Distribution Bar - Ultra Compact */}
          <div className="border-t border-white/[0.06] pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              DISTRIBUTION
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/[0.06] border border-white/[0.08] overflow-hidden rounded-sm flex">
                {highRiskModules > 0 && (
                  <motion.div
                    className="bg-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${highPct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                )}
                {mediumRiskModules > 0 && (
                  <motion.div
                    className="bg-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${mediumPct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                )}
                {lowRiskModules > 0 && (
                  <motion.div
                    className="bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${lowPct}%` }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  />
                )}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                <span>
                  <span className="text-red-400 font-bold">
                    {highRiskModules}
                  </span>
                  H
                </span>
                <span>
                  <span className="text-amber-400 font-bold">
                    {mediumRiskModules}
                  </span>
                  M
                </span>
                <span>
                  <span className="text-emerald-400 font-bold">
                    {lowRiskModules}
                  </span>
                  L
                </span>
              </div>
            </div>
          </div>

          {/* Risk Trend Sparkline - Compact */}
          <div className="border-t border-white/[0.06] pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              TREND
            </p>
            <svg
              className="w-full h-8 mb-0.5"
              viewBox="0 0 300 40"
              preserveAspectRatio="none"
            >
              {[0, 0.5, 1].map((y) => (
                <line
                  key={`grid-${y}`}
                  x1="0"
                  y1={y * 40}
                  x2="300"
                  y2={y * 40}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.5"
                />
              ))}
              <motion.polyline
                points={riskTrendData
                  .map(
                    (d, i) =>
                      `${(i / (riskTrendData.length - 1)) * 300},${
                        40 - ((d.value - trendMin) / trendRange) * 38 - 1
                      }`,
                  )
                  .join(" ")}
                fill="none"
                stroke={riskTrend === "elevated" ? "#dc2626" : riskTrend === "moderate" ? "#d97706" : "#059669"}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
            </svg>
          </div>

          {/* Impact Radius Histogram - Compact */}
          <div className="border-t border-white/[0.06] pt-2 mb-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                IMPACT
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setSortMode("cascade")}
                  className={`text-[10px] px-2 py-0.5 border rounded transition-colors font-mono ${
                    sortMode === "cascade"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "border-white/[0.08] text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  cascade
                </button>
                <button
                  onClick={() => setSortMode("volatility")}
                  className={`text-[10px] px-2 py-0.5 border rounded transition-colors font-mono ${
                    sortMode === "volatility"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "border-white/[0.08] text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  volatility
                </button>
                <button
                  onClick={() => setSortMode("standard")}
                  className={`text-[10px] px-2 py-0.5 border rounded transition-colors font-mono ${
                    sortMode === "standard"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "border-white/[0.08] text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  standard
                </button>
              </div>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {radiusHistogram.map((count, idx) => (
                <motion.div
                  key={idx}
                  className="flex-1 bg-indigo-500 border border-indigo-600"
                  initial={{ height: 0 }}
                  animate={{
                    height: `${(count / Math.max(...radiusHistogram, 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  style={{
                    minHeight: count > 0 ? "1px" : "0px",
                  }}
                  title={`${count}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Engineering Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0" style={{ ...glass, boxShadow: glowShadow }}>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Module
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Risk Score
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Bug Count
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Dependency Count
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Impact Radius
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Last Modified
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedModules.map((module, index) => (
                <motion.tr
                  key={module.id}
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`cursor-pointer border-b border-white/[0.06] transition-colors duration-150 ${
                    selectedModuleId === module.id
                      ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                      : "hover:bg-white/[0.03]"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <td className="px-6 py-3 font-medium text-white">
                    {module.module}
                  </td>
                  <td
                    className={`px-6 py-3 font-mono font-semibold ${getRiskColor(module.riskLevel)}`}
                  >
                    {module.riskScore}
                  </td>
                  <td className="px-6 py-3 text-slate-300">
                    {module.bugCount}
                  </td>
                  <td className="px-6 py-3 text-slate-300">
                    {module.dependencyCount}
                  </td>
                  <td className="px-6 py-3 text-slate-300">
                    {module.impactRadius}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {module.lastModified}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Fixed Inspector Panel */}
      <aside className="w-[360px] border-l border-white/[0.06] flex flex-col shrink-0 relative overflow-hidden" style={{ ...glass, boxShadow: glowShadow }}>
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${
            selectedModule ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="h-14 border-b border-white/[0.06] flex items-center px-5 shrink-0">
            <h2 className="text-sm font-medium text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
              Repository Intelligence
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 * 0.06 }}
              >
                <p className="text-sm font-medium text-white mb-2">
                  Risk Distribution Summary
                </p>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>High Risk Modules</span>
                    <span className="font-mono text-white">
                      {highRiskModules}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Risk Modules</span>
                    <span className="font-mono text-white">
                      {mediumRiskModules}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Risk Modules</span>
                    <span className="font-mono text-white">
                      {lowRiskModules}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 * 0.06 }}
              >
                <p className="text-sm font-medium text-white mb-2">
                  Most Volatile Dependency Chain
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {mostVolatileChain}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 * 0.06 }}
              >
                <p className="text-sm font-medium text-white mb-2">
                  Recent Risk Spikes
                </p>
                <div className="space-y-1">
                  {recentRiskSpikes.map((spike) => (
                    <p key={spike} className="text-xs text-slate-400">
                      {spike}
                    </p>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 * 0.06 }}
              >
                <p className="text-sm font-medium text-white mb-2">
                  Top 3 High-Risk Modules
                </p>
                <div className="space-y-2">
                  {topHighRiskModules.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-400">{module.module}</span>
                      <span
                        className={`font-mono ${getRiskColor(module.riskLevel)}`}
                      >
                        {module.riskScore}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${
            selectedModule ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {selectedModule ? (
            <>
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 shrink-0">
                <h2 className="text-sm font-medium text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Module Inspector
                </h2>
                <button
                  onClick={() => setSelectedModuleId(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 * 0.06 }}
                  >
                    <p className="text-xs text-slate-500 mb-1">Module Name</p>
                    <p className="text-sm font-medium text-white">
                      {selectedModule.module}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 * 0.06 }}
                  >
                    <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                    <p
                      className={`text-2xl font-mono font-medium ${getRiskColor(selectedModule.riskLevel)}`}
                    >
                      {selectedModule.riskScore}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-2">
                      Bug Breakdown
                    </p>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left py-1 font-medium text-slate-500">
                            Severity
                          </th>
                          <th className="text-right py-1 font-medium text-slate-500">
                            Count
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedModule.bugs.map((bug, idx) => (
                          <tr key={idx} className="border-b border-white/[0.04]">
                            <td className="py-1 text-slate-300 capitalize">
                              {bug.severity}
                            </td>
                            <td className="py-1 text-right font-mono text-slate-300">
                              {bug.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-2">
                      Dependency Summary
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Total Dependencies
                        </span>
                        <span className="font-mono text-white">
                          {selectedModule.dependencyCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Upstream Dependents
                        </span>
                        <span className="font-mono text-white">
                          {Math.max(1, selectedModule.dependencyCount - 2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 4 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-2">
                      Impact Radius Details
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Immediate Blast Radius
                        </span>
                        <span className="font-mono text-white">
                          {selectedModule.impactRadius}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Potentially Affected Modules
                        </span>
                        <span className="font-mono text-white">
                          {selectedModule.impactRadius + 2}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-2">
                      AI Risk Summary
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                      {selectedModule.aiSummary}
                    </p>
                  </motion.div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export default BugRisk;
