import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import useIntelligenceStore from "../store/intelligence.store";

const darkBg  = "#0B0F1A";
const cardBg  = "rgba(26,31,46,0.6)";
const glass   = {
  background: cardBg,
  backdropFilter: "blur(16px) saturate(120%)",
  WebkitBackdropFilter: "blur(16px) saturate(120%)",
};
const cardBorder = "border border-white/[0.06]";
const glowShadow = "0 0 0 1px rgba(255,255,255,0.03), 0 6px 24px rgba(0,0,0,0.3)";

function DependencyIntelligence() {
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [sortBy, setSortBy] = useState("connections");
  const [simulationMode, setSimulationMode] = useState(false);
  const [featuresView, setFeaturesView] = useState("overview"); // overview, gravity, exposure, simulation

  // ============================================================================
  // DATA FROM API VIA ZUSTAND STORE
  // ============================================================================
  const storeDeps = useIntelligenceStore((state) => state.dependencies);
  const fetchDependenciesData = useIntelligenceStore((state) => state.fetchDependenciesData);
  const initialized = useIntelligenceStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      useIntelligenceStore.getState().fetchAll();
    } else if (storeDeps.length === 0) {
      fetchDependenciesData();
    }
  }, [initialized, storeDeps.length, fetchDependenciesData]);

  // Map API data to page format (API already returns inDegree/outDegree aliases)
  const dependencies = storeDeps.map((d) => ({
    id: d.id,
    module: d.module || d.name,
    inDegree: d.inDegree ?? d.incomingCount ?? 0,
    outDegree: d.outDegree ?? d.outgoingCount ?? 0,
    depth: d.depth ?? 0,
    circularInvolvement: d.circularInvolvement ?? d.circularDeps ?? false,
    transitiveExposure: d.transitiveExposure ?? 0,
    directDeps: Array.isArray(d.directDeps) ? d.directDeps : (typeof d.directDeps === "string" ? JSON.parse(d.directDeps || "[]") : []),
    reverseDeps: Array.isArray(d.reverseDeps) ? d.reverseDeps : (typeof d.reverseDeps === "string" ? JSON.parse(d.reverseDeps || "[]") : []),
  }));

  const selectedModule = dependencies.find((d) => d.id === selectedModuleId);

  // ============================================================================
  // PHASE 1: DEPENDENCY OVERVIEW INTELLIGENCE ZONES
  // ============================================================================

  const totalModules = dependencies.length;
  const totalEdges = dependencies.reduce((sum, d) => sum + d.outDegree, 0);
  const avgDepth = useMemo(
    () =>
      totalModules
        ? (dependencies.reduce((sum, d) => sum + d.depth, 0) / totalModules).toFixed(1)
        : "0.0",
    [dependencies, totalModules],
  );
  const maxDepth = dependencies.length > 0 ? Math.max(...dependencies.map((d) => d.depth)) : 0;

  const circularDependencies = dependencies.filter(
    (d) => d.circularInvolvement,
  ).length;
  const stronglyConnectedCount = circularDependencies; // all circular modules are strongly connected
  const hubModulesCount = useMemo(() => {
    if (!totalModules) return 0;
    const avgConnections =
      dependencies.reduce((sum, d) => sum + d.inDegree + d.outDegree, 0) /
      totalModules;
    const stdDev = Math.sqrt(
      dependencies.reduce(
        (sum, d) =>
          sum + Math.pow(d.inDegree + d.outDegree - avgConnections, 2),
        0,
      ) / totalModules,
    );
    const threshold = avgConnections + 1.5 * stdDev;
    return dependencies.filter((d) => d.inDegree + d.outDegree > threshold)
      .length;
  }, [dependencies, totalModules]);
  const highFanoutModules = dependencies.filter((d) => d.outDegree > 5).length;

  const orphanModules = dependencies.filter(
    (d) => d.inDegree === 0 && d.outDegree === 0,
  ).length;
  const deadImports = dependencies.filter(
    (d) => d.inDegree > 5 && d.outDegree === 0,
  ).length;
  const overloadedHubs = dependencies.filter(
    (d) => d.inDegree + d.outDegree > 15,
  ).length;
  const transitiveExposureIndex = totalModules > 0
    ? (
      (dependencies.reduce((sum, d) => sum + d.transitiveExposure, 0) /
        totalModules) *
      100
    ).toFixed(0)
    : "0";

  // ============================================================================
  // PHASE 2: DEPENDENCY GRAVITY MAP
  // ============================================================================

  const gravityMap = useMemo(
    () =>
      [...dependencies]
        .map((d) => ({
          ...d,
          gravity: d.inDegree + d.outDegree,
        }))
        .sort((a, b) => b.gravity - a.gravity),
    [dependencies],
  );
  const maxGravity = gravityMap.length > 0 ? Math.max(...gravityMap.map((d) => d.gravity)) : 1;

  // ============================================================================
  // PHASE 3: DEPTH HISTOGRAM
  // ============================================================================

  const depthHistogram = useMemo(() => {
    const bins = Array.from({ length: maxDepth + 1 }, (_, i) => ({
      depth: i,
      count: dependencies.filter((d) => d.depth === i).length,
    }));
    return bins;
  }, [dependencies, maxDepth]);

  const depthVariance = useMemo(() => {
    const counts = depthHistogram.map((b) => b.count);
    if (!counts.length) return "0.00";
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const variance =
      counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
    return Math.sqrt(variance).toFixed(2);
  }, [depthHistogram]);

  const depthImbalanceIndex = useMemo(() => {
    if (!depthHistogram.length || !totalModules) return "0.0";
    return (
      (depthHistogram.reduce((sum, b) => sum + Math.abs(b.count - 1), 0) /
        (depthHistogram.length * totalModules)) *
      100
    ).toFixed(1);
  }, [depthHistogram, totalModules]);

  // ============================================================================
  // PHASE 4: CORE DEPENDENCY TABLE (SORTING)
  // ============================================================================

  const sortedDependencies = useMemo(() => {
    const sorted = [...dependencies];
    switch (sortBy) {
      case "connections":
        return sorted.sort(
          (a, b) => b.inDegree + b.outDegree - (a.inDegree + a.outDegree),
        );
      case "inDegree":
        return sorted.sort((a, b) => b.inDegree - a.inDegree);
      case "outDegree":
        return sorted.sort((a, b) => b.outDegree - a.outDegree);
      case "exposure":
        return sorted.sort(
          (a, b) => b.transitiveExposure - a.transitiveExposure,
        );
      case "depth":
        return sorted.sort((a, b) => b.depth - a.depth);
      default:
        return sorted;
    }
  }, [dependencies, sortBy]);

  // ============================================================================
  // PHASE 5: INSPECTOR DATA AGGREGATION
  // ============================================================================

  const topHubModules = useMemo(
    () =>
      gravityMap
        .slice(0, 3)
        .map((d) => ({ id: d.id, module: d.module, gravity: d.gravity })),
    [gravityMap],
  );

  const largestCircularCluster = useMemo(() => {
    const circularModules = dependencies.filter((d) => d.circularInvolvement);
    const maxCycle = Math.max(
      ...circularModules.map((d) => d.inDegree + d.outDegree),
      0,
    );
    return (
      circularModules.find((d) => d.inDegree + d.outDegree === maxCycle) || null
    );
  }, [dependencies]);

  const highestExposureChain = useMemo(() => {
    const maxExp = Math.max(...dependencies.map((d) => d.transitiveExposure));
    return dependencies.find((d) => d.transitiveExposure === maxExp) || null;
  }, [dependencies]);

  const structuralImbalanceWarning = useMemo(() => {
    const imbalances = dependencies.map((d) =>
      Math.abs(d.inDegree - d.outDegree),
    );
    const avgImbalance =
      imbalances.reduce((sum, i) => sum + i, 0) / imbalances.length;
    const highImbalance = imbalances.filter((i) => i > avgImbalance * 1.5);
    return {
      level:
        highImbalance.length > 2
          ? "high"
          : highImbalance.length > 0
            ? "medium"
            : "low",
      count: highImbalance.length,
    };
  }, [dependencies]);

  // ============================================================================
  // 🔟 10 ADVANCED FEATURES
  // ============================================================================

  // FEATURE 1: Dependency Gravity Index (DGI)
  const dgi = useMemo(() => {
    return dependencies
      .map((d) => ({
        ...d,
        dgi: d.inDegree + d.outDegree + d.transitiveExposure * 0.5,
      }))
      .sort((a, b) => b.dgi - a.dgi);
  }, [dependencies]);

  // FEATURE 2: Transitive Exposure Radius (nodes reachable within depth ≤ 3)
  const transitiveRadius = useMemo(() => {
    return dependencies.map((d) => {
      const reachable = dependencies.filter(
        (other) => Math.abs(other.depth - d.depth) <= 2 && other.id !== d.id,
      ).length;
      return { ...d, exposureRadius: reachable };
    });
  }, [dependencies]);

  // FEATURE 3: Circular Cluster Detector
  const circularClusters = useMemo(() => {
    const circular = dependencies.filter((d) => d.circularInvolvement);
    const clusters = [];
    let currentCluster = [];
    circular.forEach((c) => {
      if (
        currentCluster.length === 0 ||
        c.directDeps.some((dep) =>
          currentCluster.map((m) => m.module).includes(dep),
        )
      ) {
        currentCluster.push(c);
      } else {
        if (currentCluster.length > 0) clusters.push(currentCluster);
        currentCluster = [c];
      }
    });
    if (currentCluster.length > 0) clusters.push(currentCluster);
    return clusters;
  }, [dependencies]);

  // FEATURE 4: Hub Overload Indicator
  const hubThreshold = useMemo(() => {
    if (dependencies.length === 0) return 0;
    const connections = dependencies.map((d) => d.inDegree + d.outDegree);
    const mean = connections.reduce((a, b) => a + b, 0) / connections.length;
    const stdDev = Math.sqrt(
      connections.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) /
        connections.length,
    );
    return mean + 1.5 * stdDev;
  }, [dependencies]);

  const overloadedModules = useMemo(() => {
    return dependencies.filter((d) => d.inDegree + d.outDegree > hubThreshold);
  }, [dependencies, hubThreshold]);

  // FEATURE 5: Dependency Depth Imbalance Score (already calculated, enhanced)
  const depthImbalanceDetailed = useMemo(() => {
    if (dependencies.length === 0) return { variance: "0.00", score: "0" };
    const depths = dependencies.map((d) => d.depth);
    const mean = depths.reduce((a, b) => a + b, 0) / depths.length;
    const variance =
      depths.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / depths.length;
    return {
      variance: Math.sqrt(variance).toFixed(2),
      score: (variance * 10).toFixed(0),
    };
  }, [dependencies]);

  // FEATURE 6: Structural Entropy (dependency version)
  const structuralEntropy = useMemo(() => {
    if (dependencies.length === 0) return "0";
    const connections = dependencies.map((d) => d.inDegree + d.outDegree);
    const depths = dependencies.map((d) => d.depth);
    const connMean = connections.reduce((a, b) => a + b, 0) / connections.length;
    const connVariance =
      connections.reduce((sum, c) => sum + Math.pow(c - connMean, 2), 0) / connections.length;
    const depthMean = depths.reduce((a, b) => a + b, 0) / depths.length;
    const depthVariance =
      depths.reduce((sum, d) => sum + Math.pow(d - depthMean, 2), 0) / depths.length;
    const entropy = Math.min(100, (connVariance + depthVariance) * 5);
    return entropy.toFixed(0);
  }, [dependencies]);

  // FEATURE 7: Dead Dependency Detector (OutDegree > 0 AND InDegree = 0)
  const deadDependencies = useMemo(() => {
    return dependencies.filter((d) => d.outDegree > 0 && d.inDegree === 0);
  }, [dependencies]);

  // FEATURE 8: Structural Drift Indicator (simulated historical)
  const structuralDrift = useMemo(() => {
    return dependencies.map((d, i) => ({
      ...d,
      drift: ((d.inDegree - d.outDegree) % 5), // deterministic structural drift
    }));
  }, [dependencies]);

  // FEATURE 9: Dependency Density Heat Strip (ordered by gravity)
  const densityHeatStrip = useMemo(() => {
    if (dependencies.length === 0) return [];
    const maxConn = Math.max(...dependencies.map((x) => x.inDegree + x.outDegree));
    return [...dependencies]
      .sort((a, b) => b.inDegree + b.outDegree - (a.inDegree + a.outDegree))
      .map((d) => ({
        ...d,
        weight: maxConn > 0 ? (d.inDegree + d.outDegree) / maxConn : 0,
      }));
  }, [dependencies]);

  // FEATURE 10: Blast Radius Simulation
  const blastRadius = useMemo(() => {
    if (!selectedModule) return null;
    const affectedModules = [selectedModule];
    const direct = dependencies.filter((d) =>
      selectedModule.reverseDeps.includes(d.module),
    );
    const indirect = dependencies.filter((d) =>
      direct.flatMap((x) => x.reverseDeps).includes(d.module),
    );
    return {
      direct: direct.length,
      indirect: indirect.length,
      total: 1 + direct.length + indirect.length,
      risk: Math.min(
        100,
        (1 + direct.length * 1.5 + indirect.length * 0.5) * 10,
      ),
    };
  }, [selectedModule]);

  // BONUS 11: Architectural Centralization Ratio
  const centralizationRatio = useMemo(() => {
    if (dependencies.length === 0) return "0";
    const connections = dependencies.map((d) => d.inDegree + d.outDegree);
    const maxConnections = Math.max(...connections);
    const totalConnections = connections.reduce((a, b) => a + b, 0);
    return totalConnections > 0 ? ((maxConnections / totalConnections) * 100).toFixed(0) : "0";
  }, [dependencies]);

  // BONUS 12: Dependency Stability Index
  const stabilityIndex = useMemo(() => {
    if (totalModules === 0) return "0";
    const unstableModules = dependencies.filter(
      (d) => d.circularInvolvement || d.outDegree > 5,
    );
    const dependentOnUnstable = dependencies.filter((d) =>
      d.directDeps.some((dep) => unstableModules.some((u) => u.module === dep)),
    ).length;
    return ((dependentOnUnstable / totalModules) * 100).toFixed(0);
  }, [dependencies, totalModules]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full w-full flex overflow-hidden" style={{ background: darkBg }}>
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0" style={{ ...glass, boxShadow: glowShadow }}>
          <div className="flex items-center">
            <h1 className="text-sm font-semibold text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
              Dependency Intelligence
            </h1>
            <div className="flex items-center gap-2 ml-3">
              <motion.div className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ boxShadow: "0 0 8px rgba(52,211,153,0.4)" }} />
              <span className="text-[10px] font-mono text-emerald-400/70">LIVE</span>
            </div>
          </div>
          <div className="flex gap-1">
            {[
              { key: "overview", label: "Overview" },
              { key: "gravity", label: "Gravity" },
              { key: "exposure", label: "Exposure" },
              { key: "blast", label: "Blast Radius" },
            ].map((tab, idx) => (
              <motion.button
                key={tab.key}
                onClick={() => setFeaturesView(tab.key)}
                className={`text-xs px-2 py-1 border rounded transition-all ${featuresView === tab.key ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-white/[0.06] border-white/[0.06] text-slate-400"}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </header>
        {/* Scrollable Content Wrapper */}
        <div className="flex-1 overflow-y-auto">
          {/* ====================================================================
              PHASE 1: DEPENDENCY OVERVIEW INTELLIGENCE ZONES
              ==================================================================== */}
          <div className="border-b border-white/[0.06] shrink-0 px-6 py-3" style={{ ...glass, boxShadow: glowShadow }}>
            {/* Zone A — Structural Load */}
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="space-y-2 pb-4 border-r border-white/[0.06] pr-8">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Total Modules
                    </p>
                    <motion.p className="text-lg font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 * 0.04 }}>
                      {totalModules}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Total Edges
                    </p>
                    <motion.p className="text-lg font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 * 0.04 }}>
                      {totalEdges}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Avg Depth
                    </p>
                    <motion.p className="text-sm font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 * 0.04 }}>
                      L{avgDepth}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Max Depth
                    </p>
                    <motion.p className="text-sm font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 * 0.04 }}>
                      L{maxDepth}
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Zone B — Connectivity Risk */}
              <div className="flex-1">
                <div className="space-y-2 pb-4 border-r border-white/[0.06] pr-8">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Circular Dependencies
                    </p>
                    <motion.p className="text-lg font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4 * 0.04 }}>
                      {circularDependencies}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Strongly Connected
                    </p>
                    <motion.p className="text-sm font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5 * 0.04 }}>
                      {stronglyConnectedCount}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Hub Modules
                    </p>
                    <motion.p className="text-sm font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 6 * 0.04 }}>
                      {hubModulesCount}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      High-Fanout
                    </p>
                    <motion.p className="text-sm font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 7 * 0.04 }}>
                      {highFanoutModules}
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Zone C — Stability Indicators */}
              <div className="flex-1">
                <div className="space-y-2 pb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Orphan Modules
                    </p>
                    <motion.p className="text-lg font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 8 * 0.04 }}>
                      {orphanModules}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Dead Imports
                    </p>
                    <motion.p className="text-sm font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 9 * 0.04 }}>
                      {deadImports}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Overloaded Hubs
                    </p>
                    <motion.p className="text-sm font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 10 * 0.04 }}>
                      {overloadedHubs}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Transitive Exposure
                    </p>
                    <motion.p className="text-sm font-mono font-bold text-white" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 11 * 0.04 }}>
                      {transitiveExposureIndex}
                    </motion.p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================
            10 ADVANCED FEATURES DISPLAY (CONDITIONAL VIEWS)
            ==================================================================== */}

          {featuresView === "overview" && (
            <div className="bg-white/[0.04] border-b border-white/[0.06] shrink-0 px-6 py-3 grid grid-cols-6 gap-3">
              {/* F1: DGI */}
              <motion.div className={`${cardBorder} p-2 rounded-sm`} style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 * 0.04 }}>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  DGI Index
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {dgi[0]?.dgi.toFixed(0)}
                </p>
                <p className="text-[8px] text-slate-500 font-mono">
                  {dgi[0]?.module}
                </p>
              </motion.div>

              {/* F5: Depth Imbalance */}
              <motion.div className={`${cardBorder} p-2 rounded-sm`} style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 * 0.04 }}>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Depth Imbalance
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {depthImbalanceDetailed.score}
                </p>
                <p className="text-[8px] text-slate-500 font-mono">
                  Var: {depthImbalanceDetailed.variance}
                </p>
              </motion.div>

              {/* F6: Structural Entropy */}
              <motion.div className={`${cardBorder} p-2 rounded-sm`} style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 * 0.04 }}>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Struct Entropy
                </p>
                <div className="flex items-center gap-1">
                  <div className="flex-1 bg-white/[0.06] h-1 rounded overflow-hidden">
                    <motion.div
                      className="bg-indigo-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${structuralEntropy}%` }}
                      transition={{ duration: 0.5, delay: 2 * 0.03 }}
                    />
                  </div>
                  <span className="text-lg font-mono font-bold text-white w-8">
                    {structuralEntropy}
                  </span>
                </div>
              </motion.div>

              {/* F3: Circular Clusters */}
              <motion.div className={`${cardBorder} p-2 rounded-sm`} style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 * 0.04 }}>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Circular Clusters
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {circularClusters.length}
                </p>
                <p className="text-[8px] text-slate-500 font-mono">
                  {circularClusters.reduce((sum, c) => sum + c.length, 0)}{" "}
                  modules
                </p>
              </motion.div>

              {/* F7: Dead Dependencies */}
              <motion.div className={`${cardBorder} p-2 rounded-sm`} style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4 * 0.04 }}>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Dead Deps
                </p>
                <p
                  className={`text-lg font-mono font-bold ${deadDependencies.length > 0 ? "text-amber-400" : "text-white"}`}
                >
                  {deadDependencies.length}
                </p>
                <p className="text-[8px] text-slate-500 font-mono">orphaned</p>
              </motion.div>

              {/* F11: Centralization */}
              <motion.div className={`${cardBorder} p-2 rounded-sm`} style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5 * 0.04 }}>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Centralization
                </p>
                <p
                  className={`text-lg font-mono font-bold ${parseInt(centralizationRatio) > 40 ? "text-red-400" : "text-white"}`}
                >
                  {centralizationRatio}%
                </p>
                <p className="text-[8px] text-slate-500 font-mono">fragility</p>
              </motion.div>
            </div>
          )}

          {featuresView === "gravity" && (
            <div className="border-b border-white/[0.06] shrink-0 px-6 py-3" style={{ ...glass, boxShadow: glowShadow }}>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Dependency Gravity Index (DGI) Ranking
              </p>
              <div className="space-y-1">
                {dgi.slice(0, 6).map((dep, idx) => (
                  <motion.div key={dep.id} className="flex items-center gap-2 text-xs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <span className="font-mono text-slate-400 w-8">
                      {idx + 1}.
                    </span>
                    <span className="font-mono text-white flex-1">
                      {dep.module}
                    </span>
                    <div className="flex-1 bg-white/[0.06] h-1.5 rounded overflow-hidden">
                      <motion.div
                        className="bg-indigo-500 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(dep.dgi / dgi[0].dgi) * 100}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.03 }}
                      />
                    </div>
                    <span className="font-mono text-white w-12 text-right">
                      {dep.dgi.toFixed(1)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {featuresView === "exposure" && (
            <div className="border-b border-white/[0.06] shrink-0 px-6 py-3" style={{ ...glass, boxShadow: glowShadow }}>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Transitive Exposure Radius
                  </p>
                  <div className="space-y-1 text-xs">
                    {transitiveRadius
                      .sort((a, b) => b.exposureRadius - a.exposureRadius)
                      .slice(0, 6)
                      .map((dep, idx) => (
                        <motion.div key={dep.id} className="flex items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                          <span className="font-mono text-slate-400 w-24">
                            {dep.module}
                          </span>
                          <div className="flex-1 flex gap-1">
                            {Array.from({
                              length: Math.min(5, dep.exposureRadius),
                            }).map((_, i) => (
                              <div
                                key={i}
                                className="h-4 bg-cyan-500/70 border border-cyan-500 flex-1"
                                style={{ opacity: 1 - i * 0.15 }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-white w-4 text-right">
                            {dep.exposureRadius}
                          </span>
                        </motion.div>
                      ))}
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Dependency Density Heat Strip
                  </p>
                  <div className="flex items-center gap-1 h-3 bg-white/[0.06] rounded-sm overflow-hidden border border-white/[0.06]">
                    {densityHeatStrip.map((dep) => (
                      <motion.div
                        key={dep.id}
                        className="flex-1 bg-slate-500 opacity-80 hover:opacity-100 transition-opacity"
                        style={{
                          width: `${dep.weight * 100}%`,
                        }}
                        title={`${dep.module}: ${dep.inDegree + dep.outDegree} connections`}
                      />
                    ))}
                  </div>
                  <p className="text-[8px] text-slate-500 font-mono mt-1">
                    Ordered by connection weight • Hover for details
                  </p>
                </div>

                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Hub Overload Indicator
                  </p>
                  {overloadedModules.length > 0 ? (
                    <div className="space-y-1 text-xs">
                      {overloadedModules.map((dep, idx) => (
                        <motion.div
                          key={dep.id}
                          className="flex justify-between items-center bg-amber-500/15 border border-amber-500/30 p-1.5 rounded-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                        >
                          <span className="font-mono text-amber-400">
                            {dep.module}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400">
                            Overloaded
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-mono">
                      No overloaded hubs detected
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {featuresView === "blast" && (
            <div className="border-b border-white/[0.06] shrink-0 px-6 py-3" style={{ ...glass, boxShadow: glowShadow }}>
              {selectedModule && simulationMode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      Blast Radius: {selectedModule.module}
                    </p>
                    <button
                      onClick={() => setSimulationMode(false)}
                      className="text-[10px] px-2 py-1 border border-white/[0.08] rounded text-slate-400 hover:bg-white/[0.04]"
                    >
                      Exit Simulation
                    </button>
                  </div>

                  {blastRadius && (
                    <div className="space-y-2">
                      {/* Impact visualization */}
                      <motion.div className="border border-white/[0.06] p-3 rounded-sm" style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 * 0.04 }}>
                        <p className="text-[9px] font-mono text-slate-400 mb-2">
                          Impact Severity
                        </p>
                        <div className="w-full h-2 bg-white/[0.06] rounded overflow-hidden border border-white/[0.08]">
                          <motion.div
                            className={`h-full ${
                              blastRadius.risk > 70
                                ? "bg-red-500"
                                : blastRadius.risk > 40
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${blastRadius.risk}%` }}
                            transition={{ duration: 0.5, delay: 0 * 0.03 }}
                          />
                        </div>
                        <p className="text-[10px] font-mono text-white mt-1">
                          Risk Score: {blastRadius.risk.toFixed(0)}/100
                        </p>
                      </motion.div>

                      {/* Ripple layers */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono text-slate-400">
                          Propagation Layers
                        </p>
                        {/* Layer 1: Direct */}
                        <motion.div className="bg-red-500/15 border border-red-500/30 p-2 rounded-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 * 0.04 }}>
                          <p className="text-[9px] font-bold text-red-400 mb-1">
                            Layer 1: Direct Dependents
                          </p>
                          <p className="text-[10px] font-mono text-red-400">
                            {blastRadius.direct} modules affected
                          </p>
                        </motion.div>

                        {/* Layer 2: Indirect */}
                        <motion.div className="bg-orange-500/15 border border-orange-500/30 p-2 rounded-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 * 0.04 }}>
                          <p className="text-[9px] font-bold text-orange-400 mb-1">
                            Layer 2: Indirect Dependents
                          </p>
                          <p className="text-[10px] font-mono text-orange-400">
                            {blastRadius.indirect} modules affected
                          </p>
                        </motion.div>

                        {/* Total */}
                        <motion.div className="bg-white/[0.06] border border-white/[0.08] p-2 rounded-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 * 0.04 }}>
                          <p className="text-[9px] font-bold text-white mb-1">
                            Total Blast Radius
                          </p>
                          <p className="text-lg font-mono font-bold text-white">
                            {blastRadius.total} modules
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Blast Radius Simulation
                  </p>

                  <motion.div className="border border-white/[0.06] p-3 rounded-sm" style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 * 0.04 }}>
                    <p className="text-xs text-slate-400 mb-3">
                      Click a module in the table to simulate failure
                      propagation.
                    </p>
                    {selectedModule ? (
                      <button
                        onClick={() => setSimulationMode(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded border border-indigo-500 transition-colors"
                      >
                        Simulate {selectedModule.module} Failure
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500 font-mono">
                        (No module selected)
                      </p>
                    )}
                  </motion.div>

                  <motion.div className={`${cardBorder} p-3 rounded-sm`} style={{ ...glass, boxShadow: glowShadow }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 * 0.04 }}>
                    <p className="text-[9px] font-mono text-slate-400 mb-2">
                      Architecture Metrics
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Dependency Stability Index
                        </span>
                        <span className="font-mono text-white">
                          {stabilityIndex}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Architectural Centralization
                        </span>
                        <span className="font-mono text-white">
                          {centralizationRatio}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Circular Clusters
                        </span>
                        <span className="font-mono text-white">
                          {circularClusters.length}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
          <div className="border-b border-white/[0.06] shrink-0 px-6 py-3" style={{ ...glass, boxShadow: glowShadow }}>
            {/* Gravity Map */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">
                Gravity Map
              </p>
              <div className="flex items-end gap-1 h-12">
                {gravityMap.map((dep) => (
                  <motion.div
                    key={dep.id}
                    className="flex-1 flex flex-col items-center group cursor-pointer relative"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.15 }}
                  >
                    <div
                      className="w-full bg-indigo-500 border border-indigo-400/30 transition-opacity duration-150 hover:opacity-80 relative"
                      style={{
                        height: `${(dep.gravity / maxGravity) * 100}%`,
                        minHeight: "8px",
                      }}
                    >
                      {dep.inDegree > 8 && (
                        <div
                          className="absolute top-0 left-0 right-0 bg-red-500 border-t border-red-400"
                          style={{ height: "1px" }}
                        />
                      )}
                    </div>
                    <div className="invisible group-hover:visible absolute bottom-full mb-2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 font-mono border border-white/[0.06]">
                      {dep.module}: {dep.gravity} edges
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono mt-0.5 leading-none">
                      {dep.module.split("-")[0]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Depth Histogram */}
            <div className="border-t border-white/[0.06] pt-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">
                Depth Histogram
              </p>
              <div className="flex items-end gap-1 h-12 mb-3">
                {depthHistogram.map((bin) => (
                  <div
                    key={bin.depth}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-indigo-500 border border-indigo-400/30 transition-all duration-150"
                      style={{
                        height:
                          bin.count > 0
                            ? `${(bin.count / Math.max(...depthHistogram.map((b) => b.count))) * 100}%`
                            : "3px",
                      }}
                    />
                    <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                      L{bin.depth}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 text-xs">
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-mono">
                    Depth Variance
                  </p>
                  <p className="font-mono font-bold text-white">
                    {depthVariance}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-mono">
                    Imbalance Index
                  </p>
                  <p className="font-mono font-bold text-white">
                    {depthImbalanceIndex}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================
            PHASE 4: CORE DEPENDENCY TABLE
            ==================================================================== */}
          <div style={{ background: "rgba(255,255,255,0.02)" }}>
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0" style={{ ...glass, boxShadow: glowShadow }}>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-3 font-medium text-white">
                    Module
                  </th>
                  <th
                    className="text-right px-6 py-3 font-medium text-white cursor-pointer hover:bg-white/[0.03]"
                    onClick={() => setSortBy("inDegree")}
                  >
                    In-Degree
                  </th>
                  <th
                    className="text-right px-6 py-3 font-medium text-white cursor-pointer hover:bg-white/[0.03]"
                    onClick={() => setSortBy("outDegree")}
                  >
                    Out-Degree
                  </th>
                  <th
                    className="text-right px-6 py-3 font-medium text-white cursor-pointer hover:bg-white/[0.03]"
                    onClick={() => setSortBy("connections")}
                  >
                    Total Connections
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-white">
                    Depth
                  </th>
                  <th className="text-center px-6 py-3 font-medium text-white">
                    Circular
                  </th>
                  <th
                    className="text-right px-6 py-3 font-medium text-white cursor-pointer hover:bg-white/[0.03]"
                    onClick={() => setSortBy("exposure")}
                  >
                    Exposure
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedDependencies.map((dep, index) => (
                  <motion.tr
                    key={dep.id}
                    onClick={() => setSelectedModuleId(dep.id)}
                    className={`cursor-pointer border-b border-white/[0.04] transition-colors duration-150 ${
                      selectedModuleId === dep.id
                        ? "bg-indigo-500/10 border-l-2 border-l-indigo-500 pl-4"
                        : "hover:bg-white/[0.03]"
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td className="px-6 py-3 text-white font-medium">
                      {dep.module}
                    </td>
                    <td className="px-6 py-3 font-mono text-right text-slate-300">
                      {dep.inDegree}
                    </td>
                    <td className="px-6 py-3 font-mono text-right text-slate-300">
                      {dep.outDegree}
                    </td>
                    <td className="px-6 py-3 font-mono text-right font-bold text-white">
                      {dep.inDegree + dep.outDegree}
                    </td>
                    <td className="px-6 py-3 font-mono text-right text-slate-400">
                      L{dep.depth}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`text-xs font-mono ${
                          dep.circularInvolvement
                            ? "text-amber-400 font-bold"
                            : "text-slate-400"
                        }`}
                      >
                        {dep.circularInvolvement ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-right text-slate-300">
                      {dep.transitiveExposure}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>{" "}
        {/* End Scrollable Content Wrapper */}
      </main>

      {/* =====================================================================
          PHASE 5: DEPENDENCY INSPECTOR PANEL
          ===================================================================== */}
      <aside className="w-[360px] border-l border-white/[0.06] flex flex-col shrink-0 relative overflow-hidden" style={{ ...glass, boxShadow: glowShadow }}>
        {/* Default State (No Selection) */}
        <motion.div
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${
            selectedModule ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="h-14 border-b border-white/[0.06] flex items-center px-5 shrink-0">
            <h2 className="text-sm font-medium text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>Intelligence</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Top 3 Hub Modules */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 * 0.06 }}>
              <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                Top Hub Modules
              </p>
              <div className="space-y-1">
                {topHubModules.map((hub) => (
                  <div
                    key={hub.id}
                    className="flex justify-between text-xs text-slate-400 font-mono"
                  >
                    <span>{hub.module}</span>
                    <span className="text-white font-bold">
                      {hub.gravity}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Largest Circular Cluster */}
            {largestCircularCluster && (
              <motion.div className="pt-2 border-t border-white/[0.06]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 * 0.06 }}>
                <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Largest Circular Cluster
                </p>
                <div className="text-xs text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>{largestCircularCluster.module}</span>
                    <span className="text-amber-400 font-bold">
                      {largestCircularCluster.inDegree +
                        largestCircularCluster.outDegree}{" "}
                      edges
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Highest Exposure Chain */}
            {highestExposureChain && (
              <motion.div className="pt-2 border-t border-white/[0.06]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 * 0.06 }}>
                <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Highest Exposure
                </p>
                <div className="text-xs text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>{highestExposureChain.module}</span>
                    <span className="text-white font-bold">
                      {highestExposureChain.transitiveExposure}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Structural Imbalance Warning */}
            {structuralImbalanceWarning.level !== "low" && (
              <motion.div className="pt-2 border-t border-white/[0.06]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 * 0.06 }}>
                <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Structural Imbalance
                </p>
                <div className="text-xs text-slate-400">
                  <p
                    className={`font-bold ${
                      structuralImbalanceWarning.level === "high"
                        ? "text-red-400"
                        : "text-amber-400"
                    }`}
                  >
                    {structuralImbalanceWarning.level.toUpperCase()}:{" "}
                    {structuralImbalanceWarning.count} modules
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Selected Module State */}
        <motion.div
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${
            selectedModule ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {selectedModule && (
            <>
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 shrink-0">
                <h2 className="text-sm font-medium text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  {selectedModule.module}
                </h2>
                <button
                  onClick={() => setSelectedModuleId(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {/* Module Name */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 * 0.06 }}>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Module
                  </p>
                  <p className="text-sm font-mono font-bold text-white">
                    {selectedModule.module}
                  </p>
                </motion.div>

                {/* In-Degree */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 * 0.06 }}>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    In-Degree
                  </p>
                  <p className="text-sm font-mono font-bold text-white">
                    {selectedModule.inDegree}
                  </p>
                </motion.div>

                {/* Out-Degree */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 * 0.06 }}>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Out-Degree
                  </p>
                  <p className="text-sm font-mono font-bold text-white">
                    {selectedModule.outDegree}
                  </p>
                </motion.div>

                {/* Total Connections */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 * 0.06 }}>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Total Connections
                  </p>
                  <p className="text-sm font-mono font-bold text-white">
                    {selectedModule.inDegree + selectedModule.outDegree}
                  </p>
                </motion.div>

                {/* Dependency Depth */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4 * 0.06 }}>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Dependency Depth
                  </p>
                  <p className="text-sm font-mono font-bold text-white">
                    L{selectedModule.depth}
                  </p>
                </motion.div>

                {/* Circular Participation */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5 * 0.06 }}>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Circular Participation
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${
                      selectedModule.circularInvolvement
                        ? "text-amber-400"
                        : "text-white"
                    }`}
                  >
                    {selectedModule.circularInvolvement ? "Yes" : "No"}
                  </p>
                </motion.div>

                {/* Direct Dependencies List */}
                <motion.div className="pt-2 border-t border-white/[0.06]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 6 * 0.06 }}>
                  <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                    Direct Dependencies
                  </p>
                  {selectedModule.directDeps.length > 0 ? (
                    <div className="space-y-1">
                      {selectedModule.directDeps.map((dep, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-slate-400 font-mono pl-2 border-l border-white/[0.08]"
                        >
                          {dep}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono">None</p>
                  )}
                </motion.div>

                {/* Reverse Dependencies List */}
                <motion.div className="pt-2 border-t border-white/[0.06]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 7 * 0.06 }}>
                  <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                    Reverse Dependencies
                  </p>
                  {selectedModule.reverseDeps.length > 0 ? (
                    <div className="space-y-1">
                      {selectedModule.reverseDeps.map((dep, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-slate-400 font-mono pl-2 border-l border-white/[0.08]"
                        >
                          {dep}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono">None</p>
                  )}
                </motion.div>

                {/* Structural Risk Comment */}
                <motion.div className="pt-2 border-t border-white/[0.06]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 8 * 0.06 }}>
                  <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                    Risk Assessment
                  </p>
                  <p className="text-xs text-slate-400 leading-snug">
                    {selectedModule.circularInvolvement &&
                    selectedModule.inDegree > 8
                      ? "High-fanin hub with circular involvement. Consider refactoring to break cycles."
                      : selectedModule.outDegree > 5
                        ? "High-fanout module. Potential for widespread impact. Review coupling."
                        : selectedModule.transitiveExposure > 15
                          ? "Deep transitive exposure. Changes may cascade through system."
                          : "Structural stability within normal parameters."}
                  </p>
                </motion.div>

                {/* 10 ADVANCED FEATURES IN INSPECTOR */}
                <motion.div className="pt-3 border-t border-white/[0.06] space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 9 * 0.06 }}>
                  <p className="text-xs font-medium text-white uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                    Advanced Analysis
                  </p>

                  {/* F1: DGI */}
                  <motion.div className="flex justify-between items-center text-xs bg-indigo-500/15 p-1.5 rounded border border-indigo-500/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 10 * 0.06 }}>
                    <span className="text-slate-300">Gravity Index</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {dgi
                        .find((d) => d.id === selectedModule.id)
                        ?.dgi.toFixed(1)}
                    </span>
                  </motion.div>

                  {/* F2: Exposure Radius */}
                  <motion.div className="flex justify-between items-center text-xs bg-cyan-500/15 p-1.5 rounded border border-cyan-500/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 11 * 0.06 }}>
                    <span className="text-slate-300">Exposure Radius</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {
                        transitiveRadius.find((d) => d.id === selectedModule.id)
                          ?.exposureRadius
                      }
                    </span>
                  </motion.div>

                  {/* F3: Circular Cluster */}
                  <motion.div
                    className={`flex justify-between items-center text-xs p-1.5 rounded border ${
                      selectedModule.circularInvolvement
                        ? "bg-amber-500/15 border-amber-500/30"
                        : "bg-white/[0.04] border-white/[0.06]"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 12 * 0.06 }}
                  >
                    <span className="text-slate-300">Circular Cluster</span>
                    <span
                      className={`font-mono font-bold ${
                        selectedModule.circularInvolvement
                          ? "text-amber-400"
                          : "text-slate-400"
                      }`}
                    >
                      {selectedModule.circularInvolvement ? "Yes" : "No"}
                    </span>
                  </motion.div>

                  {/* F4: Hub Overload */}
                  <motion.div
                    className={`flex justify-between items-center text-xs p-1.5 rounded border ${
                      selectedModule.inDegree + selectedModule.outDegree >
                      hubThreshold
                        ? "bg-red-500/15 border-red-500/30"
                        : "bg-white/[0.04] border-white/[0.06]"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 13 * 0.06 }}
                  >
                    <span className="text-slate-300">Hub Status</span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        selectedModule.inDegree + selectedModule.outDegree >
                        hubThreshold
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {selectedModule.inDegree + selectedModule.outDegree >
                      hubThreshold
                        ? "Overloaded"
                        : "Normal"}
                    </span>
                  </motion.div>

                  {/* F7: Dead Dependency */}
                  <motion.div
                    className={`flex justify-between items-center text-xs p-1.5 rounded border ${
                      selectedModule.outDegree > 0 &&
                      selectedModule.inDegree === 0
                        ? "bg-white/[0.06] border-white/[0.08]"
                        : "bg-white/[0.04] border-white/[0.06]"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 14 * 0.06 }}
                  >
                    <span className="text-slate-300">Orphaned</span>
                    <span
                      className={`font-mono font-bold ${
                        selectedModule.outDegree > 0 &&
                        selectedModule.inDegree === 0
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      {selectedModule.outDegree > 0 &&
                      selectedModule.inDegree === 0
                        ? "Yes"
                        : "No"}
                    </span>
                  </motion.div>

                  {/* F8: Structural Drift */}
                  <motion.div className="flex justify-between items-center text-xs bg-purple-500/15 p-1.5 rounded border border-purple-500/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 15 * 0.06 }}>
                    <span className="text-slate-300">Structural Drift</span>
                    <span
                      className={`font-mono font-bold ${
                        structuralDrift.find((d) => d.id === selectedModule.id)
                          ?.drift > 0
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {structuralDrift.find((d) => d.id === selectedModule.id)
                        ?.drift > 0
                        ? "+"
                        : ""}
                      {
                        structuralDrift.find((d) => d.id === selectedModule.id)
                          ?.drift
                      }
                    </span>
                  </motion.div>

                  {/* Blast Simulation Toggle */}
                  {selectedModule && (
                    <button
                      onClick={() => setSimulationMode(!simulationMode)}
                      className="w-full text-xs font-medium p-1.5 rounded border border-indigo-500/50 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                    >
                      {simulationMode && selectedModuleId
                        ? "Exit Simulation"
                        : "Simulate Failure"}
                    </button>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </motion.div>
      </aside>
    </div>
  );
}

export default DependencyIntelligence;
