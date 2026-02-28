import { useState, useMemo } from "react";

function BugRisk() {
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [sortMode, setSortMode] = useState("cascade"); // "cascade", "volatility", "standard"

  // Mock module data
  const modules = [
    {
      id: 1,
      module: "Auth Service",
      riskScore: 92,
      riskLevel: "high",
      bugCount: 8,
      dependencyCount: 14,
      impactRadius: 6,
      lastModified: "2h ago",
      bugs: [
        { severity: "critical", count: 2 },
        { severity: "high", count: 3 },
        { severity: "medium", count: 3 },
      ],
      aiSummary:
        "Critical authentication module with token validation vulnerabilities. High dependency count indicates widespread impact across services. Recent changes introduced race conditions in session management.",
    },
    {
      id: 2,
      module: "Payment Gateway",
      riskScore: 85,
      riskLevel: "high",
      bugCount: 12,
      dependencyCount: 9,
      impactRadius: 8,
      lastModified: "4h ago",
      bugs: [
        { severity: "critical", count: 1 },
        { severity: "high", count: 4 },
        { severity: "medium", count: 7 },
      ],
      aiSummary:
        "Transaction processing core with race condition vulnerabilities. High impact radius due to financial dependencies. Memory leak patterns detected in concurrent payment flows requiring immediate attention.",
    },
    {
      id: 3,
      module: "Core API",
      riskScore: 78,
      riskLevel: "high",
      bugCount: 6,
      dependencyCount: 22,
      impactRadius: 12,
      lastModified: "1d ago",
      bugs: [
        { severity: "high", count: 2 },
        { severity: "medium", count: 4 },
      ],
      aiSummary:
        "Central routing layer with memory management issues. Highest dependency count creates cascading failure risk. Request handler leak affects long-running processes under sustained load conditions.",
    },
    {
      id: 4,
      module: "Event Stream",
      riskScore: 62,
      riskLevel: "medium",
      bugCount: 5,
      dependencyCount: 8,
      impactRadius: 4,
      lastModified: "6h ago",
      bugs: [
        { severity: "high", count: 1 },
        { severity: "medium", count: 3 },
        { severity: "low", count: 1 },
      ],
      aiSummary:
        "Message ordering inconsistencies in distributed event processing. Medium severity with potential data consistency implications across downstream consumers requiring architectural review.",
    },
    {
      id: 5,
      module: "UI Shell",
      riskScore: 54,
      riskLevel: "medium",
      bugCount: 4,
      dependencyCount: 6,
      impactRadius: 2,
      lastModified: "12h ago",
      bugs: [
        { severity: "medium", count: 3 },
        { severity: "low", count: 1 },
      ],
      aiSummary:
        "Component lifecycle memory retention in single-page application. Low impact radius but affects user experience. Moderate priority for performance optimization cycle addressing retention patterns.",
    },
    {
      id: 6,
      module: "Vector Store",
      riskScore: 38,
      riskLevel: "low",
      bugCount: 3,
      dependencyCount: 4,
      impactRadius: 3,
      lastModified: "2d ago",
      bugs: [
        { severity: "medium", count: 1 },
        { severity: "low", count: 2 },
      ],
      aiSummary:
        "Index rebuild performance degradation under high-dimensional workloads. Low risk with isolated impact. Secondary priority optimization for embedding storage layer efficiency.",
    },
    {
      id: 7,
      module: "Webhook Handler",
      riskScore: 29,
      riskLevel: "low",
      bugCount: 2,
      dependencyCount: 3,
      impactRadius: 1,
      lastModified: "3d ago",
      bugs: [{ severity: "low", count: 2 }],
      aiSummary:
        "Retry logic excessive backoff delays external notification delivery. Minimal impact with contained scope. Low priority tuning for webhook delivery latency optimization.",
    },
  ];

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  // ==================== ENTROPY CALCULATION ====================
  // Shannon entropy: H = -Σ(p_i * log2(p_i))
  // Measures risk distribution concentration (0=concentrated, log2(n)=uniform)
  const calculateEntropy = () => {
    const totalScore = modules.reduce((sum, m) => sum + m.riskScore, 0);
    const probabilities = modules.map((m) => m.riskScore / totalScore);
    const entropy = -probabilities.reduce((sum, p) => {
      if (p === 0) return sum;
      return sum + p * Math.log2(p);
    }, 0);
    const maxEntropy = Math.log2(modules.length);
    const normalizedEntropy = (entropy / maxEntropy) * 100;
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

  const sortedModules = useMemo(() => getSortedModules(), [sortMode]);
  const entropy = useMemo(() => calculateEntropy(), []);

  // ==================== METRICS & AGGREGATES ====================
  const totalRiskScore = modules.reduce((sum, m) => sum + m.riskScore, 0);
  const criticalModules = modules.filter((m) => m.riskLevel === "high").length;
  const circularDependencies = 3; // Mock value
  const avgDependencyDepth = 2.4; // Mock value
  const riskTrend = "+12%"; // Mock value

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
    if (riskLevel === "low") return "text-emerald-600";
    if (riskLevel === "medium") return "text-amber-600";
    if (riskLevel === "high") return "text-red-600";
    return "text-slate-900";
  };

  // Calculate additional metrics for diagnostic zones
  const totalDependencies = modules.reduce(
    (sum, m) => sum + m.dependencyCount,
    0,
  );
  const maxImpactRadius = Math.max(...modules.map((m) => m.impactRadius));
  const mostVolatileModule = modules.reduce((prev, curr) =>
    curr.riskScore > prev.riskScore ? curr : prev,
  );
  const recentlyModifiedHighRisk = modules
    .filter((m) => m.riskLevel !== "low")
    .slice(0, 1)
    .map((m) => m.module)
    .join(", ");

  // Risk distribution percentages
  const totalModules = modules.length;
  const lowPct = Math.round((lowRiskModules / totalModules) * 100);
  const mediumPct = Math.round((mediumRiskModules / totalModules) * 100);
  const highPct = Math.round((highRiskModules / totalModules) * 100);

  // Risk trend data (mock historical data for sparkline)
  const riskTrendData = [8, 10, 9, 11, 14, 12, 15, 18, 17, 20, 19, 23].map(
    (v, i) => ({ id: i, value: v }),
  );
  const trendMin = Math.min(...riskTrendData.map((d) => d.value));
  const trendMax = Math.max(...riskTrendData.map((d) => d.value));
  const trendRange = trendMax - trendMin;

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
    <div className="h-full w-full bg-[#f8fafc] flex overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
          <h1 className="text-sm font-semibold text-slate-900">
            Bug Risk Analysis
          </h1>
        </header>

        {/* Risk Overview Diagnostic Console */}
        <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3 overflow-y-auto">
          {/* Zone Groupings - Ultra Compact */}
          <div className="flex gap-10 mb-4">
            {/* Zone A — System Severity + Entropy */}
            <div className="flex-1 border-r border-slate-200 pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Risk Score
                  </p>
                  <p className="text-xl font-mono font-bold text-slate-900 leading-none">
                    {totalRiskScore}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Risk Entropy
                  </p>
                  <p className="text-sm font-mono text-slate-900 leading-none">
                    {entropy.normalized}%
                    <span className="ml-1 text-xs text-slate-500">
                      ({entropy.interpretation})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Critical
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${criticalModules > 2 ? "text-red-600" : "text-slate-900"}`}
                  >
                    {criticalModules}/{totalModules}
                  </p>
                </div>
              </div>
            </div>

            {/* Zone B — Structural Complexity */}
            <div className="flex-1 border-r border-slate-200 pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Avg Depth
                  </p>
                  <p className="text-xl font-mono font-bold text-slate-900 leading-none">
                    {avgDependencyDepth}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Cycles
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${circularDependencies > 0 ? "text-red-600" : "text-slate-900"}`}
                  >
                    {circularDependencies}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Edges
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {totalDependencies}
                  </p>
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
                  <p className="text-sm font-mono font-bold text-slate-900 truncate leading-tight">
                    {mostVolatileModule.module}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Max Radius
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900 leading-none">
                    {maxImpactRadius}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    Trend
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${riskTrend.startsWith("+") ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {riskTrend}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Distribution Bar - Ultra Compact */}
          <div className="border-t border-slate-200 pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              DISTRIBUTION
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 border border-slate-300 overflow-hidden rounded-sm flex">
                {highRiskModules > 0 && (
                  <div
                    className="bg-red-500 transition-all duration-150"
                    style={{ width: `${highPct}%` }}
                  />
                )}
                {mediumRiskModules > 0 && (
                  <div
                    className="bg-amber-500 transition-all duration-150"
                    style={{ width: `${mediumPct}%` }}
                  />
                )}
                {lowRiskModules > 0 && (
                  <div
                    className="bg-emerald-500 transition-all duration-150"
                    style={{ width: `${lowPct}%` }}
                  />
                )}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-600 font-mono">
                <span>
                  <span className="text-red-600 font-bold">
                    {highRiskModules}
                  </span>
                  H
                </span>
                <span>
                  <span className="text-amber-600 font-bold">
                    {mediumRiskModules}
                  </span>
                  M
                </span>
                <span>
                  <span className="text-emerald-600 font-bold">
                    {lowRiskModules}
                  </span>
                  L
                </span>
              </div>
            </div>
          </div>

          {/* Risk Trend Sparkline - Compact */}
          <div className="border-t border-slate-200 pt-2 mb-3">
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
                  stroke="#e2e8f0"
                  strokeWidth="0.5"
                />
              ))}
              <polyline
                points={riskTrendData
                  .map(
                    (d, i) =>
                      `${(i / (riskTrendData.length - 1)) * 300},${
                        40 - ((d.value - trendMin) / trendRange) * 38 - 1
                      }`,
                  )
                  .join(" ")}
                fill="none"
                stroke={riskTrend.startsWith("+") ? "#dc2626" : "#059669"}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Impact Radius Histogram - Compact */}
          <div className="border-t border-slate-200 pt-2 mb-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                IMPACT
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setSortMode("cascade")}
                  className={`text-[10px] px-2 py-0.5 border rounded transition-colors font-mono ${
                    sortMode === "cascade"
                      ? "bg-slate-800 text-white border-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  cascade
                </button>
                <button
                  onClick={() => setSortMode("volatility")}
                  className={`text-[10px] px-2 py-0.5 border rounded transition-colors font-mono ${
                    sortMode === "volatility"
                      ? "bg-slate-800 text-white border-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  volatility
                </button>
                <button
                  onClick={() => setSortMode("standard")}
                  className={`text-[10px] px-2 py-0.5 border rounded transition-colors font-mono ${
                    sortMode === "standard"
                      ? "bg-slate-800 text-white border-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  standard
                </button>
              </div>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {radiusHistogram.map((count, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-slate-400 border border-slate-400 transition-all duration-150"
                  style={{
                    height: `${(count / Math.max(...radiusHistogram, 1)) * 100}%`,
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
            <thead className="bg-white sticky top-0">
              <tr className="border-b border-slate-200">
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Module
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Risk Score
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Bug Count
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Dependency Count
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Impact Radius
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Last Modified
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedModules.map((module) => (
                <tr
                  key={module.id}
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`cursor-pointer border-b border-slate-200 transition-colors duration-150 ${
                    selectedModuleId === module.id
                      ? "bg-slate-100 border-l-2 border-l-blue-500"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {module.module}
                  </td>
                  <td
                    className={`px-6 py-3 font-mono font-semibold ${getRiskColor(module.riskLevel)}`}
                  >
                    {module.riskScore}
                  </td>
                  <td className="px-6 py-3 text-slate-900">
                    {module.bugCount}
                  </td>
                  <td className="px-6 py-3 text-slate-900">
                    {module.dependencyCount}
                  </td>
                  <td className="px-6 py-3 text-slate-900">
                    {module.impactRadius}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {module.lastModified}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Fixed Inspector Panel */}
      <aside className="w-[360px] border-l border-slate-200 bg-white flex flex-col shrink-0 relative overflow-hidden">
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${
            selectedModule ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="h-14 border-b border-slate-200 flex items-center px-5 shrink-0">
            <h2 className="text-sm font-medium text-slate-900">
              Repository Intelligence
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Risk Distribution Summary
                </p>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>High Risk Modules</span>
                    <span className="font-mono text-slate-900">
                      {highRiskModules}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Risk Modules</span>
                    <span className="font-mono text-slate-900">
                      {mediumRiskModules}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Risk Modules</span>
                    <span className="font-mono text-slate-900">
                      {lowRiskModules}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Most Volatile Dependency Chain
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {mostVolatileChain}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Recent Risk Spikes
                </p>
                <div className="space-y-1">
                  {recentRiskSpikes.map((spike) => (
                    <p key={spike} className="text-xs text-slate-600">
                      {spike}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Top 3 High-Risk Modules
                </p>
                <div className="space-y-2">
                  {topHighRiskModules.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-600">{module.module}</span>
                      <span
                        className={`font-mono ${getRiskColor(module.riskLevel)}`}
                      >
                        {module.riskScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
              <div className="h-14 border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
                <h2 className="text-sm font-medium text-slate-900">
                  Module Inspector
                </h2>
                <button
                  onClick={() => setSelectedModuleId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Module Name</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedModule.module}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                    <p
                      className={`text-2xl font-mono font-medium ${getRiskColor(selectedModule.riskLevel)}`}
                    >
                      {selectedModule.riskScore}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Bug Breakdown
                    </p>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
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
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="py-1 text-slate-900 capitalize">
                              {bug.severity}
                            </td>
                            <td className="py-1 text-right font-mono text-slate-900">
                              {bug.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Dependency Summary
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Total Dependencies
                        </span>
                        <span className="font-mono text-slate-900">
                          {selectedModule.dependencyCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Upstream Dependents
                        </span>
                        <span className="font-mono text-slate-900">
                          {Math.max(1, selectedModule.dependencyCount - 2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Impact Radius Details
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Immediate Blast Radius
                        </span>
                        <span className="font-mono text-slate-900">
                          {selectedModule.impactRadius}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Potentially Affected Modules
                        </span>
                        <span className="font-mono text-slate-900">
                          {selectedModule.impactRadius + 2}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      AI Risk Summary
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-4">
                      {selectedModule.aiSummary}
                    </p>
                  </div>
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
