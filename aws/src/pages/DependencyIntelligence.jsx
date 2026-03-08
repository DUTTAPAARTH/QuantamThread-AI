import { useState, useMemo } from "react";
import { motion } from "framer-motion";

function DependencyIntelligence() {
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [sortBy, setSortBy] = useState("connections");
  const [simulationMode, setSimulationMode] = useState(false);
  const [featuresView, setFeaturesView] = useState("overview"); // overview, gravity, exposure, simulation

  // ============================================================================
  // MOCK DEPENDENCY GRAPH DATA
  // ============================================================================
  const dependencies = [
    {
      id: 1,
      module: "auth-core",
      inDegree: 8,
      outDegree: 3,
      depth: 0,
      circularInvolvement: false,
      transitiveExposure: 8,
      directDeps: ["crypto-lib"],
      reverseDeps: ["api-gateway", "event-stream"],
    },
    {
      id: 2,
      module: "api-gateway",
      inDegree: 12,
      outDegree: 5,
      depth: 1,
      circularInvolvement: true,
      transitiveExposure: 17,
      directDeps: ["auth-core", "http-client"],
      reverseDeps: ["event-stream"],
    },
    {
      id: 3,
      module: "crypto-lib",
      inDegree: 5,
      outDegree: 2,
      depth: 2,
      circularInvolvement: false,
      transitiveExposure: 7,
      directDeps: ["logging-lib"],
      reverseDeps: ["auth-core", "http-client"],
    },
    {
      id: 4,
      module: "event-stream",
      inDegree: 14,
      outDegree: 7,
      depth: 1,
      circularInvolvement: true,
      transitiveExposure: 21,
      directDeps: ["api-gateway", "auth-core"],
      reverseDeps: [],
    },
    {
      id: 5,
      module: "http-client",
      inDegree: 9,
      outDegree: 4,
      depth: 2,
      circularInvolvement: true,
      transitiveExposure: 13,
      directDeps: ["crypto-lib", "logging-lib"],
      reverseDeps: ["api-gateway"],
    },
    {
      id: 6,
      module: "logging-lib",
      inDegree: 11,
      outDegree: 1,
      depth: 3,
      circularInvolvement: false,
      transitiveExposure: 12,
      directDeps: [],
      reverseDeps: ["crypto-lib", "http-client"],
    },
  ];

  const selectedModule = dependencies.find((d) => d.id === selectedModuleId);

  // ============================================================================
  // PHASE 1: DEPENDENCY OVERVIEW INTELLIGENCE ZONES
  // ============================================================================

  const totalModules = dependencies.length;
  const totalEdges = dependencies.reduce((sum, d) => sum + d.outDegree, 0);
  const avgDepth = useMemo(
    () =>
      (
        dependencies.reduce((sum, d) => sum + d.depth, 0) / totalModules
      ).toFixed(1),
    [],
  );
  const maxDepth = Math.max(...dependencies.map((d) => d.depth));

  const circularDependencies = dependencies.filter(
    (d) => d.circularInvolvement,
  ).length;
  const stronglyConnectedCount = Math.ceil(circularDependencies * 0.4); // subset of circular
  const hubModulesCount = useMemo(() => {
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
  }, []);
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
  const transitiveExposureIndex = (
    (dependencies.reduce((sum, d) => sum + d.transitiveExposure, 0) /
      totalModules) *
    100
  ).toFixed(0);

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
    [],
  );
  const maxGravity = Math.max(...gravityMap.map((d) => d.gravity));

  // ============================================================================
  // PHASE 3: DEPTH HISTOGRAM
  // ============================================================================

  const depthHistogram = useMemo(() => {
    const bins = Array.from({ length: maxDepth + 1 }, (_, i) => ({
      depth: i,
      count: dependencies.filter((d) => d.depth === i).length,
    }));
    return bins;
  }, []);

  const depthVariance = useMemo(() => {
    const counts = depthHistogram.map((b) => b.count);
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const variance =
      counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
    return Math.sqrt(variance).toFixed(2);
  }, []);

  const depthImbalanceIndex = useMemo(() => {
    return (
      (depthHistogram.reduce((sum, b) => sum + Math.abs(b.count - 1), 0) /
        (depthHistogram.length * totalModules)) *
      100
    ).toFixed(1);
  }, []);

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
  }, [sortBy]);

  // ============================================================================
  // PHASE 5: INSPECTOR DATA AGGREGATION
  // ============================================================================

  const topHubModules = useMemo(
    () =>
      gravityMap
        .slice(0, 3)
        .map((d) => ({ id: d.id, module: d.module, gravity: d.gravity })),
    [],
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
  }, []);

  const highestExposureChain = useMemo(() => {
    const maxExp = Math.max(...dependencies.map((d) => d.transitiveExposure));
    return dependencies.find((d) => d.transitiveExposure === maxExp) || null;
  }, []);

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
  }, []);

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
  }, []);

  // FEATURE 2: Transitive Exposure Radius (nodes reachable within depth ≤ 3)
  const transitiveRadius = useMemo(() => {
    return dependencies.map((d) => {
      const reachable = dependencies.filter(
        (other) => Math.abs(other.depth - d.depth) <= 2 && other.id !== d.id,
      ).length;
      return { ...d, exposureRadius: reachable };
    });
  }, []);

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
  }, []);

  // FEATURE 4: Hub Overload Indicator
  const hubThreshold = useMemo(() => {
    const connections = dependencies.map((d) => d.inDegree + d.outDegree);
    const mean = connections.reduce((a, b) => a + b, 0) / connections.length;
    const stdDev = Math.sqrt(
      connections.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) /
        connections.length,
    );
    return mean + 1.5 * stdDev;
  }, []);

  const overloadedModules = useMemo(() => {
    return dependencies.filter((d) => d.inDegree + d.outDegree > hubThreshold);
  }, []);

  // FEATURE 5: Dependency Depth Imbalance Score (already calculated, enhanced)
  const depthImbalanceDetailed = useMemo(() => {
    const depths = dependencies.map((d) => d.depth);
    const mean = depths.reduce((a, b) => a + b, 0) / depths.length;
    const variance =
      depths.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / depths.length;
    return {
      variance: Math.sqrt(variance).toFixed(2),
      score: (variance * 10).toFixed(0),
    };
  }, []);

  // FEATURE 6: Structural Entropy (dependency version)
  const structuralEntropy = useMemo(() => {
    const connections = dependencies.map((d) => d.inDegree + d.outDegree);
    const depths = dependencies.map((d) => d.depth);
    const connVariance =
      connections.reduce(
        (sum, c) =>
          sum +
          Math.pow(
            c - connections.reduce((a, b) => a + b, 0) / connections.length,
            2,
          ),
        0,
      ) / connections.length;
    const depthVariance =
      depths.reduce(
        (sum, d) =>
          sum +
          Math.pow(d - depths.reduce((a, b) => a + b, 0) / depths.length, 2),
        0,
      ) / depths.length;
    const entropy = Math.min(100, (connVariance + depthVariance) * 5);
    return entropy.toFixed(0);
  }, []);

  // FEATURE 7: Dead Dependency Detector (OutDegree > 0 AND InDegree = 0)
  const deadDependencies = useMemo(() => {
    return dependencies.filter((d) => d.outDegree > 0 && d.inDegree === 0);
  }, []);

  // FEATURE 8: Structural Drift Indicator (simulated historical)
  const structuralDrift = useMemo(() => {
    return dependencies.map((d) => ({
      ...d,
      drift: Math.floor(Math.random() * 5) - 2, // simulated change -2 to +2
    }));
  }, []);

  // FEATURE 9: Dependency Density Heat Strip (ordered by gravity)
  const densityHeatStrip = useMemo(() => {
    return [...dependencies]
      .sort((a, b) => b.inDegree + b.outDegree - (a.inDegree + a.outDegree))
      .map((d) => ({
        ...d,
        weight:
          (d.inDegree + d.outDegree) /
          Math.max(...dependencies.map((x) => x.inDegree + x.outDegree)),
      }));
  }, []);

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
    const connections = dependencies.map((d) => d.inDegree + d.outDegree);
    const maxConnections = Math.max(...connections);
    const totalConnections = connections.reduce((a, b) => a + b, 0);
    return ((maxConnections / totalConnections) * 100).toFixed(0);
  }, []);

  // BONUS 12: Dependency Stability Index
  const stabilityIndex = useMemo(() => {
    const unstableModules = dependencies.filter(
      (d) => d.circularInvolvement || d.outDegree > 5,
    );
    const dependentOnUnstable = dependencies.filter((d) =>
      d.directDeps.some((dep) => unstableModules.some((u) => u.module === dep)),
    ).length;
    return ((dependentOnUnstable / totalModules) * 100).toFixed(0);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full w-full bg-[#f8fafc] flex overflow-hidden">
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-semibold text-slate-900">
            Dependency Intelligence
          </h1>
          <div className="flex gap-1">
            <button
              onClick={() => setFeaturesView("overview")}
              className={`text-xs px-2 py-1 border rounded transition-all ${featuresView === "overview" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setFeaturesView("gravity")}
              className={`text-xs px-2 py-1 border rounded transition-all ${featuresView === "gravity" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600"}`}
            >
              Gravity
            </button>
            <button
              onClick={() => setFeaturesView("exposure")}
              className={`text-xs px-2 py-1 border rounded transition-all ${featuresView === "exposure" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600"}`}
            >
              Exposure
            </button>
            <button
              onClick={() => setFeaturesView("blast")}
              className={`text-xs px-2 py-1 border rounded transition-all ${featuresView === "blast" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600"}`}
            >
              Blast Radius
            </button>
          </div>
        </header>
        {/* Scrollable Content Wrapper */}
        <div className="flex-1 overflow-y-auto">
          {/* ====================================================================
              PHASE 1: DEPENDENCY OVERVIEW INTELLIGENCE ZONES
              ==================================================================== */}
          <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3">
            {/* Zone A — Structural Load */}
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="space-y-2 pb-4 border-r border-slate-200 pr-8">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Total Modules
                    </p>
                    <p className="text-lg font-mono font-bold text-slate-900">
                      {totalModules}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Total Edges
                    </p>
                    <p className="text-lg font-mono font-bold text-slate-900">
                      {totalEdges}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Avg Depth
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      L{avgDepth}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Max Depth
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      L{maxDepth}
                    </p>
                  </div>
                </div>
              </div>

              {/* Zone B — Connectivity Risk */}
              <div className="flex-1">
                <div className="space-y-2 pb-4 border-r border-slate-200 pr-8">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Circular Dependencies
                    </p>
                    <p className="text-lg font-mono font-bold text-slate-900">
                      {circularDependencies}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Strongly Connected
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {stronglyConnectedCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Hub Modules
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {hubModulesCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      High-Fanout
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {highFanoutModules}
                    </p>
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
                    <p className="text-lg font-mono font-bold text-slate-900">
                      {orphanModules}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Dead Imports
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {deadImports}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Overloaded Hubs
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {overloadedHubs}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                      Transitive Exposure
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {transitiveExposureIndex}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================
            10 ADVANCED FEATURES DISPLAY (CONDITIONAL VIEWS)
            ==================================================================== */}

          {featuresView === "overview" && (
            <div className="bg-slate-50 border-b border-slate-200 shrink-0 px-6 py-3 grid grid-cols-6 gap-3">
              {/* F1: DGI */}
              <div className="bg-white border border-slate-200 p-2 rounded-sm">
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  DGI Index
                </p>
                <p className="text-lg font-mono font-bold text-slate-900">
                  {dgi[0]?.dgi.toFixed(0)}
                </p>
                <p className="text-[8px] text-slate-500 font-mono">
                  {dgi[0]?.module}
                </p>
              </div>

              {/* F5: Depth Imbalance */}
              <div className="bg-white border border-slate-200 p-2 rounded-sm">
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Depth Imbalance
                </p>
                <p className="text-lg font-mono font-bold text-slate-900">
                  {depthImbalanceDetailed.score}
                </p>
                <p className="text-[8px] text-slate-500 font-mono">
                  Var: {depthImbalanceDetailed.variance}
                </p>
              </div>

              {/* F6: Structural Entropy */}
              <div className="bg-white border border-slate-200 p-2 rounded-sm">
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Struct Entropy
                </p>
                <div className="flex items-center gap-1">
                  <div className="flex-1 bg-slate-200 h-1 rounded overflow-hidden">
                    <div
                      className="bg-slate-600 h-full transition-all"
                      style={{ width: `${structuralEntropy}%` }}
                    />
                  </div>
                  <span className="text-lg font-mono font-bold text-slate-900 w-8">
                    {structuralEntropy}
                  </span>
                </div>
              </div>

              {/* F3: Circular Clusters */}
              <div className="bg-white border border-slate-200 p-2 rounded-sm">
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Circular Clusters
                </p>
                <p className="text-lg font-mono font-bold text-slate-900">
                  {circularClusters.length}
                </p>
                <p className="text-[8px] text-slate-500 font-mono">
                  {circularClusters.reduce((sum, c) => sum + c.length, 0)}{" "}
                  modules
                </p>
              </div>

              {/* F7: Dead Dependencies */}
              <div className="bg-white border border-slate-200 p-2 rounded-sm">
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Dead Deps
                </p>
                <p
                  className={`text-lg font-mono font-bold ${deadDependencies.length > 0 ? "text-amber-600" : "text-slate-900"}`}
                >
                  {deadDependencies.length}
                </p>
                <p className="text-[8px] text-slate-500 font-mono">orphaned</p>
              </div>

              {/* F11: Centralization */}
              <div className="bg-white border border-slate-200 p-2 rounded-sm">
                <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                  Centralization
                </p>
                <p
                  className={`text-lg font-mono font-bold ${parseInt(centralizationRatio) > 40 ? "text-red-600" : "text-slate-900"}`}
                >
                  {centralizationRatio}%
                </p>
                <p className="text-[8px] text-slate-500 font-mono">fragility</p>
              </div>
            </div>
          )}

          {featuresView === "gravity" && (
            <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Dependency Gravity Index (DGI) Ranking
              </p>
              <div className="space-y-1">
                {dgi.slice(0, 6).map((dep, idx) => (
                  <div key={dep.id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-600 w-8">
                      {idx + 1}.
                    </span>
                    <span className="font-mono text-slate-900 flex-1">
                      {dep.module}
                    </span>
                    <div className="flex-1 bg-slate-200 h-1.5 rounded overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all"
                        style={{ width: `${(dep.dgi / dgi[0].dgi) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-900 w-12 text-right">
                      {dep.dgi.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {featuresView === "exposure" && (
            <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Transitive Exposure Radius
                  </p>
                  <div className="space-y-1 text-xs">
                    {transitiveRadius
                      .sort((a, b) => b.exposureRadius - a.exposureRadius)
                      .slice(0, 6)
                      .map((dep) => (
                        <div key={dep.id} className="flex items-center gap-2">
                          <span className="font-mono text-slate-600 w-24">
                            {dep.module}
                          </span>
                          <div className="flex-1 flex gap-1">
                            {Array.from({
                              length: Math.min(5, dep.exposureRadius),
                            }).map((_, i) => (
                              <div
                                key={i}
                                className="h-4 bg-cyan-500 opacity-70 border border-cyan-600 flex-1"
                                style={{ opacity: 1 - i * 0.15 }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-slate-900 w-4 text-right">
                            {dep.exposureRadius}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Dependency Density Heat Strip
                  </p>
                  <div className="flex items-center gap-1 h-3 bg-slate-100 rounded-sm overflow-hidden border border-slate-200">
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

                <div className="border-t border-slate-200 pt-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Hub Overload Indicator
                  </p>
                  {overloadedModules.length > 0 ? (
                    <div className="space-y-1 text-xs">
                      {overloadedModules.map((dep) => (
                        <div
                          key={dep.id}
                          className="flex justify-between items-center bg-amber-50 border border-amber-200 p-1.5 rounded-sm"
                        >
                          <span className="font-mono text-amber-900">
                            {dep.module}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700">
                            Overloaded
                          </span>
                        </div>
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
            <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3">
              {selectedModule && simulationMode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      Blast Radius: {selectedModule.module}
                    </p>
                    <button
                      onClick={() => setSimulationMode(false)}
                      className="text-[10px] px-2 py-1 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                    >
                      Exit Simulation
                    </button>
                  </div>

                  {blastRadius && (
                    <div className="space-y-2">
                      {/* Impact visualization */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm">
                        <p className="text-[9px] font-mono text-slate-600 mb-2">
                          Impact Severity
                        </p>
                        <div className="w-full h-2 bg-slate-200 rounded overflow-hidden border border-slate-300">
                          <div
                            className={`h-full transition-all ${
                              blastRadius.risk > 70
                                ? "bg-red-500"
                                : blastRadius.risk > 40
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${blastRadius.risk}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-mono text-slate-900 mt-1">
                          Risk Score: {blastRadius.risk.toFixed(0)}/100
                        </p>
                      </div>

                      {/* Ripple layers */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono text-slate-600">
                          Propagation Layers
                        </p>
                        {/* Layer 1: Direct */}
                        <div className="bg-red-50 border border-red-300 p-2 rounded-sm">
                          <p className="text-[9px] font-bold text-red-900 mb-1">
                            Layer 1: Direct Dependents
                          </p>
                          <p className="text-[10px] font-mono text-red-700">
                            {blastRadius.direct} modules affected
                          </p>
                        </div>

                        {/* Layer 2: Indirect */}
                        <div className="bg-orange-50 border border-orange-300 p-2 rounded-sm">
                          <p className="text-[9px] font-bold text-orange-900 mb-1">
                            Layer 2: Indirect Dependents
                          </p>
                          <p className="text-[10px] font-mono text-orange-700">
                            {blastRadius.indirect} modules affected
                          </p>
                        </div>

                        {/* Total */}
                        <div className="bg-slate-100 border border-slate-400 p-2 rounded-sm">
                          <p className="text-[9px] font-bold text-slate-900 mb-1">
                            Total Blast Radius
                          </p>
                          <p className="text-lg font-mono font-bold text-slate-900">
                            {blastRadius.total} modules
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Blast Radius Simulation
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm">
                    <p className="text-xs text-slate-600 mb-3">
                      Click a module in the table to simulate failure
                      propagation.
                    </p>
                    {selectedModule ? (
                      <button
                        onClick={() => setSimulationMode(true)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 rounded border border-blue-600 transition-colors"
                      >
                        Simulate {selectedModule.module} Failure
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500 font-mono">
                        (No module selected)
                      </p>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 p-3 rounded-sm">
                    <p className="text-[9px] font-mono text-slate-600 mb-2">
                      Architecture Metrics
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Dependency Stability Index
                        </span>
                        <span className="font-mono text-slate-900">
                          {stabilityIndex}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Architectural Centralization
                        </span>
                        <span className="font-mono text-slate-900">
                          {centralizationRatio}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Circular Clusters
                        </span>
                        <span className="font-mono text-slate-900">
                          {circularClusters.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3">
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
                      className="w-full bg-slate-500 border border-slate-600 transition-opacity duration-150 hover:opacity-80 relative"
                      style={{
                        height: `${(dep.gravity / maxGravity) * 100}%`,
                        minHeight: "8px",
                      }}
                    >
                      {dep.inDegree > 8 && (
                        <div
                          className="absolute top-0 left-0 right-0 bg-red-500 border-t border-red-600"
                          style={{ height: "1px" }}
                        />
                      )}
                    </div>
                    <div className="invisible group-hover:visible absolute bottom-full mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 font-mono">
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
            <div className="border-t border-slate-200 pt-3">
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
                      className="w-full bg-slate-700 border border-slate-800 transition-all duration-150"
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
                  <p className="font-mono font-bold text-slate-900">
                    {depthVariance}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-mono">
                    Imbalance Index
                  </p>
                  <p className="font-mono font-bold text-slate-900">
                    {depthImbalanceIndex}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================
            PHASE 4: CORE DEPENDENCY TABLE
            ==================================================================== */}
          <div className="bg-white">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-6 py-3 font-medium text-slate-900">
                    Module
                  </th>
                  <th
                    className="text-right px-6 py-3 font-medium text-slate-900 cursor-pointer hover:bg-slate-50"
                    onClick={() => setSortBy("inDegree")}
                  >
                    In-Degree
                  </th>
                  <th
                    className="text-right px-6 py-3 font-medium text-slate-900 cursor-pointer hover:bg-slate-50"
                    onClick={() => setSortBy("outDegree")}
                  >
                    Out-Degree
                  </th>
                  <th
                    className="text-right px-6 py-3 font-medium text-slate-900 cursor-pointer hover:bg-slate-50"
                    onClick={() => setSortBy("connections")}
                  >
                    Total Connections
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-slate-900">
                    Depth
                  </th>
                  <th className="text-center px-6 py-3 font-medium text-slate-900">
                    Circular
                  </th>
                  <th
                    className="text-right px-6 py-3 font-medium text-slate-900 cursor-pointer hover:bg-slate-50"
                    onClick={() => setSortBy("exposure")}
                  >
                    Exposure
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedDependencies.map((dep) => (
                  <tr
                    key={dep.id}
                    onClick={() => setSelectedModuleId(dep.id)}
                    className={`cursor-pointer border-b border-slate-200 transition-colors duration-150 ${
                      selectedModuleId === dep.id
                        ? "bg-slate-100 border-l-2 border-l-blue-500 pl-4"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-6 py-3 text-slate-900 font-medium">
                      {dep.module}
                    </td>
                    <td className="px-6 py-3 font-mono text-right text-slate-900">
                      {dep.inDegree}
                    </td>
                    <td className="px-6 py-3 font-mono text-right text-slate-900">
                      {dep.outDegree}
                    </td>
                    <td className="px-6 py-3 font-mono text-right font-bold text-slate-900">
                      {dep.inDegree + dep.outDegree}
                    </td>
                    <td className="px-6 py-3 font-mono text-right text-slate-600">
                      L{dep.depth}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`text-xs font-mono ${
                          dep.circularInvolvement
                            ? "text-amber-600 font-bold"
                            : "text-slate-400"
                        }`}
                      >
                        {dep.circularInvolvement ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-right text-slate-900">
                      {dep.transitiveExposure}
                    </td>
                  </tr>
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
      <aside className="w-[360px] border-l border-slate-200 bg-white flex flex-col shrink-0 relative overflow-hidden">
        {/* Default State (No Selection) */}
        <motion.div
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${
            selectedModule ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="h-14 border-b border-slate-200 flex items-center px-5 shrink-0">
            <h2 className="text-sm font-medium text-slate-900">Intelligence</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Top 3 Hub Modules */}
            <div>
              <p className="text-xs font-medium text-slate-900 mb-2 uppercase tracking-wider">
                Top Hub Modules
              </p>
              <div className="space-y-1">
                {topHubModules.map((hub) => (
                  <div
                    key={hub.id}
                    className="flex justify-between text-xs text-slate-600 font-mono"
                  >
                    <span>{hub.module}</span>
                    <span className="text-slate-900 font-bold">
                      {hub.gravity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Largest Circular Cluster */}
            {largestCircularCluster && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-900 mb-2 uppercase tracking-wider">
                  Largest Circular Cluster
                </p>
                <div className="text-xs text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span>{largestCircularCluster.module}</span>
                    <span className="text-amber-600 font-bold">
                      {largestCircularCluster.inDegree +
                        largestCircularCluster.outDegree}{" "}
                      edges
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Highest Exposure Chain */}
            {highestExposureChain && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-900 mb-2 uppercase tracking-wider">
                  Highest Exposure
                </p>
                <div className="text-xs text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span>{highestExposureChain.module}</span>
                    <span className="text-slate-900 font-bold">
                      {highestExposureChain.transitiveExposure}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Structural Imbalance Warning */}
            {structuralImbalanceWarning.level !== "low" && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-900 mb-2 uppercase tracking-wider">
                  Structural Imbalance
                </p>
                <div className="text-xs text-slate-600">
                  <p
                    className={`font-bold ${
                      structuralImbalanceWarning.level === "high"
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    {structuralImbalanceWarning.level.toUpperCase()}:{" "}
                    {structuralImbalanceWarning.count} modules
                  </p>
                </div>
              </div>
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
              <div className="h-14 border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
                <h2 className="text-sm font-medium text-slate-900">
                  {selectedModule.module}
                </h2>
                <button
                  onClick={() => setSelectedModuleId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {/* Module Name */}
                <div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Module
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {selectedModule.module}
                  </p>
                </div>

                {/* In-Degree */}
                <div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    In-Degree
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {selectedModule.inDegree}
                  </p>
                </div>

                {/* Out-Degree */}
                <div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Out-Degree
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {selectedModule.outDegree}
                  </p>
                </div>

                {/* Total Connections */}
                <div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Total Connections
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {selectedModule.inDegree + selectedModule.outDegree}
                  </p>
                </div>

                {/* Dependency Depth */}
                <div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Dependency Depth
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    L{selectedModule.depth}
                  </p>
                </div>

                {/* Circular Participation */}
                <div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-mono">
                    Circular Participation
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${
                      selectedModule.circularInvolvement
                        ? "text-amber-600"
                        : "text-slate-900"
                    }`}
                  >
                    {selectedModule.circularInvolvement ? "Yes" : "No"}
                  </p>
                </div>

                {/* Direct Dependencies List */}
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-900 mb-2 uppercase tracking-wider">
                    Direct Dependencies
                  </p>
                  {selectedModule.directDeps.length > 0 ? (
                    <div className="space-y-1">
                      {selectedModule.directDeps.map((dep, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-slate-600 font-mono pl-2 border-l border-slate-300"
                        >
                          {dep}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono">None</p>
                  )}
                </div>

                {/* Reverse Dependencies List */}
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-900 mb-2 uppercase tracking-wider">
                    Reverse Dependencies
                  </p>
                  {selectedModule.reverseDeps.length > 0 ? (
                    <div className="space-y-1">
                      {selectedModule.reverseDeps.map((dep, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-slate-600 font-mono pl-2 border-l border-slate-300"
                        >
                          {dep}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono">None</p>
                  )}
                </div>

                {/* Structural Risk Comment */}
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-900 mb-2 uppercase tracking-wider">
                    Risk Assessment
                  </p>
                  <p className="text-xs text-slate-600 leading-snug">
                    {selectedModule.circularInvolvement &&
                    selectedModule.inDegree > 8
                      ? "High-fanin hub with circular involvement. Consider refactoring to break cycles."
                      : selectedModule.outDegree > 5
                        ? "High-fanout module. Potential for widespread impact. Review coupling."
                        : selectedModule.transitiveExposure > 15
                          ? "Deep transitive exposure. Changes may cascade through system."
                          : "Structural stability within normal parameters."}
                  </p>
                </div>

                {/* 10 ADVANCED FEATURES IN INSPECTOR */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <p className="text-xs font-medium text-slate-900 uppercase tracking-wider">
                    Advanced Analysis
                  </p>

                  {/* F1: DGI */}
                  <div className="flex justify-between items-center text-xs bg-blue-50 p-1.5 rounded border border-blue-200">
                    <span className="text-slate-700">Gravity Index</span>
                    <span className="font-mono font-bold text-blue-700">
                      {dgi
                        .find((d) => d.id === selectedModule.id)
                        ?.dgi.toFixed(1)}
                    </span>
                  </div>

                  {/* F2: Exposure Radius */}
                  <div className="flex justify-between items-center text-xs bg-cyan-50 p-1.5 rounded border border-cyan-200">
                    <span className="text-slate-700">Exposure Radius</span>
                    <span className="font-mono font-bold text-cyan-700">
                      {
                        transitiveRadius.find((d) => d.id === selectedModule.id)
                          ?.exposureRadius
                      }
                    </span>
                  </div>

                  {/* F3: Circular Cluster */}
                  <div
                    className={`flex justify-between items-center text-xs p-1.5 rounded border ${
                      selectedModule.circularInvolvement
                        ? "bg-amber-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className="text-slate-700">Circular Cluster</span>
                    <span
                      className={`font-mono font-bold ${
                        selectedModule.circularInvolvement
                          ? "text-amber-700"
                          : "text-slate-600"
                      }`}
                    >
                      {selectedModule.circularInvolvement ? "Yes" : "No"}
                    </span>
                  </div>

                  {/* F4: Hub Overload */}
                  <div
                    className={`flex justify-between items-center text-xs p-1.5 rounded border ${
                      selectedModule.inDegree + selectedModule.outDegree >
                      hubThreshold
                        ? "bg-red-50 border-red-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className="text-slate-700">Hub Status</span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        selectedModule.inDegree + selectedModule.outDegree >
                        hubThreshold
                          ? "text-red-700"
                          : "text-slate-600"
                      }`}
                    >
                      {selectedModule.inDegree + selectedModule.outDegree >
                      hubThreshold
                        ? "Overloaded"
                        : "Normal"}
                    </span>
                  </div>

                  {/* F7: Dead Dependency */}
                  <div
                    className={`flex justify-between items-center text-xs p-1.5 rounded border ${
                      selectedModule.outDegree > 0 &&
                      selectedModule.inDegree === 0
                        ? "bg-slate-200 border-slate-400"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className="text-slate-700">Orphaned</span>
                    <span
                      className={`font-mono font-bold ${
                        selectedModule.outDegree > 0 &&
                        selectedModule.inDegree === 0
                          ? "text-slate-700"
                          : "text-slate-500"
                      }`}
                    >
                      {selectedModule.outDegree > 0 &&
                      selectedModule.inDegree === 0
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>

                  {/* F8: Structural Drift */}
                  <div className="flex justify-between items-center text-xs bg-purple-50 p-1.5 rounded border border-purple-200">
                    <span className="text-slate-700">Structural Drift</span>
                    <span
                      className={`font-mono font-bold ${
                        structuralDrift.find((d) => d.id === selectedModule.id)
                          ?.drift > 0
                          ? "text-red-600"
                          : "text-emerald-600"
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
                  </div>

                  {/* Blast Simulation Toggle */}
                  {selectedModule && (
                    <button
                      onClick={() => setSimulationMode(!simulationMode)}
                      className="w-full text-xs font-medium p-1.5 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      {simulationMode && selectedModuleId
                        ? "Exit Simulation"
                        : "Simulate Failure"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </aside>
    </div>
  );
}

export default DependencyIntelligence;
