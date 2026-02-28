import { useState, useMemo } from "react";
import { motion } from "framer-motion";

function RepositoryEvolution() {
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [detailView, setDetailView] = useState("timeline"); // timeline, quadrant, coupling

  // Mock temporal evolution data
  const timePeriods = [
    {
      id: 1,
      version: "1.0.0",
      date: "Jan 2024",
      riskScore: 42,
      vulnerability_accumulation: 2,
      dependency_count: 12,
      entropy: 0.45,
      modulesChanged: 5,
      commitCount: 18,
      avgCommitSize: 2.3,
      codeChurn: 245,
      daysToRelease: 14,
      breakingChanges: 0,
      bugsFixed: 8,
      featureCount: 3,
    },
    {
      id: 2,
      version: "1.1.0",
      date: "Feb 2024",
      riskScore: 48,
      vulnerability_accumulation: 4,
      dependency_count: 15,
      entropy: 0.52,
      modulesChanged: 7,
      commitCount: 22,
      avgCommitSize: 2.8,
      codeChurn: 328,
      daysToRelease: 16,
      breakingChanges: 0,
      bugsFixed: 12,
      featureCount: 5,
    },
    {
      id: 3,
      version: "1.2.0",
      date: "Mar 2024",
      riskScore: 55,
      vulnerability_accumulation: 6,
      dependency_count: 18,
      entropy: 0.58,
      modulesChanged: 9,
      commitCount: 28,
      avgCommitSize: 3.1,
      codeChurn: 412,
      daysToRelease: 18,
      breakingChanges: 1,
      bugsFixed: 15,
      featureCount: 7,
    },
    {
      id: 4,
      version: "1.3.0",
      date: "Apr 2024",
      riskScore: 61,
      vulnerability_accumulation: 9,
      dependency_count: 22,
      entropy: 0.65,
      modulesChanged: 12,
      commitCount: 35,
      avgCommitSize: 3.5,
      codeChurn: 521,
      daysToRelease: 20,
      breakingChanges: 2,
      bugsFixed: 18,
      featureCount: 9,
    },
    {
      id: 5,
      version: "2.0.0",
      date: "May 2024",
      riskScore: 52,
      vulnerability_accumulation: 7,
      dependency_count: 20,
      entropy: 0.48,
      modulesChanged: 14,
      commitCount: 42,
      avgCommitSize: 4.2,
      codeChurn: 615,
      daysToRelease: 25,
      breakingChanges: 8,
      bugsFixed: 22,
      featureCount: 12,
    },
    {
      id: 6,
      version: "2.1.0",
      date: "Jun 2024",
      riskScore: 58,
      vulnerability_accumulation: 10,
      dependency_count: 24,
      entropy: 0.62,
      modulesChanged: 11,
      commitCount: 38,
      avgCommitSize: 3.8,
      codeChurn: 485,
      daysToRelease: 17,
      breakingChanges: 1,
      bugsFixed: 20,
      featureCount: 8,
    },
  ];

  const selectedPeriod = timePeriods.find((p) => p.id === selectedPeriodId);

  // ==================== 10 UNIQUE FEATURES ====================

  // FEATURE 1: VOLATILITY INDEX (0-100) - Measures release instability
  const volatilityIndex = useMemo(() => {
    return timePeriods.map((p, idx) => {
      if (idx === 0) return 0;
      const prev = timePeriods[idx - 1];
      const riskChange = Math.abs(p.riskScore - prev.riskScore);
      const entropyChange = Math.abs((p.entropy - prev.entropy) * 100);
      const commitVelocity = p.commitCount - prev.commitCount;
      return Math.min(
        100,
        riskChange * 2 + entropyChange * 1.5 + commitVelocity * 0.5,
      );
    });
  }, []);

  // FEATURE 2: RELEASE VELOCITY (commits per day) - Development speed
  const releaseVelocity = useMemo(
    () => timePeriods.map((p) => (p.commitCount / p.daysToRelease).toFixed(2)),
    [],
  );

  // FEATURE 3: REGRESSION RISK INDEX (0-100) - Likelihood of regressions
  const regressionRisk = useMemo(() => {
    return timePeriods.map((p) => {
      const codeChurnRisk = Math.min(100, (p.codeChurn / 10) * 0.3);
      const velocityRisk = Math.min(
        100,
        parseFloat(releaseVelocity[p.id - 1]) * 5,
      );
      const complexityRisk = p.entropy * 20;
      return (codeChurnRisk + velocityRisk + complexityRisk) / 3;
    });
  }, []);

  // FEATURE 4: COUPLING INDEX TIMELINE - Dependency complexity trend
  const couplingIndex = useMemo(() => {
    return timePeriods.map((p, idx) => {
      if (idx === 0) return p.dependency_count;
      const prev = timePeriods[idx - 1];
      const growthRate =
        ((p.dependency_count - prev.dependency_count) / prev.dependency_count) *
        100;
      return p.dependency_count + growthRate * 0.5;
    });
  }, []);

  // FEATURE 5: BREAKING CHANGE RISK SCORE (0-100) - Breaking change likelihood
  const breakingChangeRisk = useMemo(() => {
    return timePeriods.map((p) => {
      const directRisk = p.breakingChanges * 10;
      const entropyIndicator = p.entropy * 25;
      const largeCommitRisk = p.avgCommitSize > 3.5 ? 20 : 10;
      return Math.min(100, directRisk + entropyIndicator + largeCommitRisk);
    });
  }, []);

  // FEATURE 6: HEALTH SCORE (0-100) - Composite quality metric
  const healthScore = useMemo(() => {
    return timePeriods.map((p) => {
      const riskComponent = Math.max(0, 100 - p.riskScore * 1.5);
      const stabilityComponent = 100 - volatilityIndex[p.id - 1] * 0.8;
      const testingComponent = p.bugsFixed * 2;
      const velocityComponent = Math.min(
        100,
        parseFloat(releaseVelocity[p.id - 1]) * 15,
      );
      return (
        (riskComponent +
          stabilityComponent +
          testingComponent +
          velocityComponent) /
        4
      );
    });
  }, []);

  // FEATURE 7: RELEASE CONFIDENCE (0-100%) - Quality assurance confidence
  const releaseConfidence = useMemo(() => {
    return timePeriods.map((p, idx) => {
      const riskConfidence = Math.max(0, 100 - p.riskScore);
      const changeStabilityConfidence = 100 - regressionRisk[idx];
      const testCoverageConfidence = Math.min(100, p.bugsFixed * 5);
      const breakingChangeConfidence = 100 - breakingChangeRisk[idx];
      return (
        (riskConfidence +
          changeStabilityConfidence +
          testCoverageConfidence +
          breakingChangeConfidence) /
        4
      );
    });
  }, []);

  // FEATURE 8: CODE CHURN TREND - Visual of code changes magnitude
  const codeChurnTrend = useMemo(
    () =>
      timePeriods.map((p) => ({
        version: p.version,
        churn: p.codeChurn,
        ratio:
          (p.codeChurn / Math.max(...timePeriods.map((t) => t.codeChurn))) *
          100,
      })),
    [],
  );

  // FEATURE 9: STABILITY VS VELOCITY QUADRANT
  const stabilityVelocityQuadrant = useMemo(() => {
    const avgVelocity =
      releaseVelocity.reduce((a, b) => a + parseFloat(b), 0) /
      releaseVelocity.length;
    const avgStability =
      volatilityIndex.reduce((a, b) => a + b, 0) / volatilityIndex.length;

    return timePeriods.map((p, idx) => ({
      version: p.version,
      velocity: parseFloat(releaseVelocity[idx]),
      stability: 100 - volatilityIndex[idx],
      quadrant:
        parseFloat(releaseVelocity[idx]) > avgVelocity &&
        volatilityIndex[idx] < avgStability
          ? "optimal"
          : parseFloat(releaseVelocity[idx]) > avgVelocity
            ? "fast-risky"
            : volatilityIndex[idx] < avgStability
              ? "slow-stable"
              : "unstable",
    }));
  }, []);

  // FEATURE 10: ENTROPY PREDICTION - Where is entropy heading?
  const entropyPrediction = useMemo(() => {
    const recentTrend =
      timePeriods[timePeriods.length - 1].entropy -
      timePeriods[Math.max(0, timePeriods.length - 3)].entropy;
    const trend = recentTrend / 3;
    const predicted = timePeriods[timePeriods.length - 1].entropy + trend * 2;
    return {
      current: timePeriods[timePeriods.length - 1].entropy.toFixed(3),
      predicted: Math.min(1, predicted).toFixed(3),
      trajectory: trend > 0 ? "increasing" : "decreasing",
      rate: Math.abs(trend).toFixed(3),
    };
  }, []);

  // ==================== EVOLUTION METRICS ====================
  const riskTrend = (
    timePeriods[timePeriods.length - 1].riskScore - timePeriods[0].riskScore
  ).toFixed(1);
  const vulnerabilityTrend =
    timePeriods[timePeriods.length - 1].vulnerability_accumulation -
    timePeriods[0].vulnerability_accumulation;
  const dependencyGrowth =
    timePeriods[timePeriods.length - 1].dependency_count -
    timePeriods[0].dependency_count;
  const entropyTrend = (
    timePeriods[timePeriods.length - 1].entropy - timePeriods[0].entropy
  ).toFixed(2);

  const totalCommits = timePeriods.reduce((sum, p) => sum + p.commitCount, 0);
  const totalModulesChanged = timePeriods.reduce(
    (max, p) => Math.max(max, p.modulesChanged),
    0,
  );

  const currentRisk = timePeriods[timePeriods.length - 1].riskScore;
  const avgEntropy = (
    timePeriods.reduce((sum, p) => sum + p.entropy, 0) / timePeriods.length
  ).toFixed(2);
  const currentVulns =
    timePeriods[timePeriods.length - 1].vulnerability_accumulation;

  // Structural drift (change in dependency count over time)
  const structuralDrift = (
    ((timePeriods[timePeriods.length - 1].dependency_count -
      timePeriods[0].dependency_count) /
      timePeriods[0].dependency_count) *
    100
  ).toFixed(1);

  const maxRisk = Math.max(...timePeriods.map((p) => p.riskScore));
  const maxEntropy = Math.max(...timePeriods.map((p) => p.entropy));
  const maxVulns = Math.max(
    ...timePeriods.map((p) => p.vulnerability_accumulation),
  );

  return (
    <div className="h-full w-full bg-[#f8fafc] flex overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header with Tab Navigation */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-semibold text-slate-900">
            Repository Evolution
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setDetailView("timeline")}
              className={`text-xs px-3 py-1 border rounded transition-all duration-150 font-medium ${
                detailView === "timeline"
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setDetailView("quadrant")}
              className={`text-xs px-3 py-1 border rounded transition-all duration-150 font-medium ${
                detailView === "quadrant"
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Stability/Velocity
            </button>
            <button
              onClick={() => setDetailView("coupling")}
              className={`text-xs px-3 py-1 border rounded transition-all duration-150 font-medium ${
                detailView === "coupling"
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Coupling Trend
            </button>
          </div>
        </header>

        {/* ====================================================================
            PHASE 1+: ENHANCED EVOLUTION METRICS WITH 10 FEATURES
            ==================================================================== */}
        <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3">
          <div className="flex gap-10 mb-4">
            {/* Zone A — Risk & Vulnerability Trends */}
            <div className="flex-1 border-r border-slate-200 pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    CURRENT RISK
                  </p>
                  <p
                    className={`text-xl font-mono font-bold leading-none ${currentRisk > 60 ? "text-red-600" : currentRisk > 40 ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {currentRisk}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    RISK TREND
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${parseFloat(riskTrend) > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {parseFloat(riskTrend) > 0 ? "+" : ""}
                    {riskTrend}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    TOTAL VULNS
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${currentVulns > 7 ? "text-red-600" : currentVulns > 4 ? "text-amber-600" : "text-slate-900"}`}
                  >
                    {currentVulns}
                  </p>
                </div>
              </div>
            </div>

            {/* Zone B — Structural Metrics */}
            <div className="flex-1 border-r border-slate-200 pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    DEPENDENCY GROWTH
                  </p>
                  <p className="text-xl font-mono font-bold leading-none text-slate-900">
                    +{dependencyGrowth}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    STRUCTURAL DRIFT
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${parseFloat(structuralDrift) > 50 ? "text-red-600" : parseFloat(structuralDrift) > 25 ? "text-amber-600" : "text-slate-900"}`}
                  >
                    {structuralDrift}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    AVG ENTROPY
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {avgEntropy}
                  </p>
                </div>
              </div>
            </div>

            {/* Zone C — Activity Metrics */}
            <div className="flex-1">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    TOTAL COMMITS
                  </p>
                  <p className="text-xl font-mono font-bold leading-none text-slate-900">
                    {totalCommits}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    ENTROPY TREND
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${parseFloat(entropyTrend) > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {parseFloat(entropyTrend) > 0 ? "+" : ""}
                    {entropyTrend}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    VULN ACCUMULATION
                  </p>
                  <p className="text-sm font-mono font-bold text-red-600">
                    +{vulnerabilityTrend}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Trend Sparkline */}
          <div className="border-t border-slate-200 pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              RISK TRAJECTORY
            </p>
            <div className="flex items-end gap-1 h-8">
              {timePeriods.map((period) => (
                <div
                  key={period.id}
                  className="flex-1 bg-orange-500 border border-orange-600 transition-all duration-150"
                  style={{ height: `${(period.riskScore / maxRisk) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Entropy Trend */}
          <div className="border-t border-slate-200 pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              ENTROPY INCREASE
            </p>
            <div className="flex items-end gap-1 h-8">
              {timePeriods.map((period) => (
                <div
                  key={period.id}
                  className="flex-1 bg-slate-600 border border-slate-700 transition-all duration-150"
                  style={{ height: `${(period.entropy / maxEntropy) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Vulnerability Accumulation */}
          <div className="border-t border-slate-200 pt-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              VULNERABILITY GROWTH
            </p>
            <div className="flex items-end gap-1 h-8">
              {timePeriods.map((period) => (
                <div
                  key={period.id}
                  className="flex-1 bg-red-600 border border-red-700 transition-all duration-150"
                  style={{
                    height: `${(period.vulnerability_accumulation / maxVulns) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ====================================================================
            10 UNIQUE FEATURES DISPLAY
            ==================================================================== */}

        {detailView === "timeline" && (
          <div className="bg-slate-50 border-b border-slate-200 shrink-0 px-6 py-3 grid grid-cols-5 gap-3">
            {/* FEATURE 1: Volatility Index */}
            <div className="bg-white border border-slate-200 p-3 rounded-sm">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Volatility Index
              </p>
              <div className="flex items-end gap-0.5 h-6 mb-2">
                {volatilityIndex.map((vol, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-slate-500 opacity-70"
                    style={{ height: `${Math.max(5, (vol / 100) * 100)}%` }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-600 font-mono">
                Current:{" "}
                {volatilityIndex[volatilityIndex.length - 1].toFixed(0)}
              </p>
            </div>

            {/* FEATURE 2: Release Velocity */}
            <div className="bg-white border border-slate-200 p-3 rounded-sm">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Release Velocity
              </p>
              <div className="flex items-end gap-0.5 h-6 mb-2">
                {releaseVelocity.map((vel, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-500 opacity-70"
                    style={{
                      height: `${Math.max(5, (parseFloat(vel) / 3) * 100)}%`,
                    }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-600 font-mono">
                {releaseVelocity[releaseVelocity.length - 1]} commits/day
              </p>
            </div>

            {/* FEATURE 3: Regression Risk */}
            <div className="bg-white border border-slate-200 p-3 rounded-sm">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Regression Risk
              </p>
              <div className="flex items-end gap-0.5 h-6 mb-2">
                {regressionRisk.map((risk, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 opacity-70 ${
                      risk > 60
                        ? "bg-red-500"
                        : risk > 40
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ height: `${Math.max(5, (risk / 100) * 100)}%` }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-600 font-mono">
                {regressionRisk[regressionRisk.length - 1].toFixed(0)}%
              </p>
            </div>

            {/* FEATURE 4: Health Score */}
            <div className="bg-white border border-slate-200 p-3 rounded-sm">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Health Score
              </p>
              <div className="flex items-end gap-0.5 h-6 mb-2">
                {healthScore.map((score, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 opacity-70 ${
                      score > 70
                        ? "bg-emerald-500"
                        : score > 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ height: `${Math.max(5, (score / 100) * 100)}%` }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-600 font-mono">
                {healthScore[healthScore.length - 1].toFixed(0)}/100
              </p>
            </div>

            {/* FEATURE 5: Release Confidence */}
            <div className="bg-white border border-slate-200 p-3 rounded-sm">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Release Confidence
              </p>
              <div className="flex items-end gap-0.5 h-6 mb-2">
                {releaseConfidence.map((conf, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 opacity-70 ${
                      conf > 75
                        ? "bg-emerald-500"
                        : conf > 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ height: `${Math.max(5, (conf / 100) * 100)}%` }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-600 font-mono">
                {releaseConfidence[releaseConfidence.length - 1].toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {detailView === "quadrant" && (
          <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-4">
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Stability vs Velocity Matrix
              </p>
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-sm relative min-h-40">
                  {/* Quadrant lines */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400" />
                  </div>
                  <div className="relative z-10 h-full flex items-end justify-between px-2 pb-2">
                    {stabilityVelocityQuadrant.map((point, idx) => (
                      <motion.div
                        key={idx}
                        className="flex flex-col items-center relative"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white cursor-pointer transition-all hover:scale-125 ${
                            point.quadrant === "optimal"
                              ? "bg-emerald-500"
                              : point.quadrant === "fast-risky"
                                ? "bg-red-500"
                                : point.quadrant === "slow-stable"
                                  ? "bg-blue-500"
                                  : "bg-orange-500"
                          }`}
                          style={{
                            left: `${(point.velocity / 3) * 100}%`,
                            bottom: `${(point.stability / 120) * 100}%`,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-[8px] text-slate-600 mt-1 font-mono">
                          {point.version}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="absolute bottom-1 left-2 text-[8px] text-slate-500 font-mono">
                    Fast
                  </div>
                  <div className="absolute top-1 right-2 text-[8px] text-slate-500 font-mono">
                    Stable
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-mono text-slate-600 mb-1">
                      Quadrant Legend:
                    </p>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                        <span>Optimal (Fast & Stable)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span>Fast-Risky</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span>Slow-Stable</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full" />
                        <span>Unstable</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailView === "coupling" && (
          <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3">
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Coupling Index & Code Churn Trends
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Coupling Index */}
                <div>
                  <div className="text-[9px] text-slate-500 mb-2 font-mono">
                    Coupling Index (Dependencies Complexity)
                  </div>
                  <div className="flex items-end gap-1 h-8">
                    {couplingIndex.map((coupling, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-purple-500 opacity-70 border border-purple-600 transition-all hover:opacity-100"
                        style={{
                          height: `${Math.max(5, (coupling / 30) * 100)}%`,
                        }}
                        title={`${timePeriods[idx].version}: ${coupling.toFixed(1)}`}
                      />
                    ))}
                  </div>
                </div>
                {/* Code Churn */}
                <div>
                  <div className="text-[9px] text-slate-500 mb-2 font-mono">
                    Code Churn (Lines Changed)
                  </div>
                  <div className="flex items-end gap-1 h-8">
                    {codeChurnTrend.map((churn, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-cyan-500 opacity-70 border border-cyan-600 transition-all hover:opacity-100"
                        style={{
                          height: `${Math.max(5, churn.ratio)}%`,
                        }}
                        title={`${churn.version}: ${churn.churn} lines`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Version Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-white sticky top-0">
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-2 font-medium text-slate-900">
                  Version
                </th>
                <th className="text-left px-4 py-2 font-medium text-slate-900">
                  Date
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-900">
                  Risk
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-900">
                  【Health
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-900">
                  Volatility
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-900">
                  Velocity
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-900">
                  Regression
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-900">
                  Breaking
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-900">
                  Confidence
                </th>
                <th className="text-right px-4 py-2 font-medium text-slate-900">
                  Churn
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-900">
                  Entropy
                </th>
                <th className="text-right px-4 py-2 font-medium text-slate-900">
                  Commits
                </th>
              </tr>
            </thead>
            <tbody>
              {timePeriods.map((period, idx) => (
                <tr
                  key={period.id}
                  onClick={() => setSelectedPeriodId(period.id)}
                  className={`cursor-pointer border-b border-slate-200 transition-colors duration-150 text-[11px] ${selectedPeriodId === period.id ? "bg-slate-100 border-l-2 border-l-blue-500" : "bg-white hover:bg-slate-50"}`}
                >
                  <td className="px-4 py-2 text-slate-900 font-medium">
                    {period.version}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{period.date}</td>
                  <td
                    className={`px-4 py-2 font-mono font-bold text-center ${period.riskScore > 60 ? "text-red-600" : period.riskScore > 40 ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {period.riskScore}
                  </td>
                  <td
                    className={`px-4 py-2 font-mono font-bold text-center ${healthScore[idx] > 70 ? "text-emerald-600" : healthScore[idx] > 50 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {healthScore[idx].toFixed(0)}
                  </td>
                  <td
                    className={`px-4 py-2 font-mono text-center ${volatilityIndex[idx] < 35 ? "text-emerald-600" : volatilityIndex[idx] < 65 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {volatilityIndex[idx].toFixed(0)}
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-900 text-center">
                    {releaseVelocity[idx]}
                  </td>
                  <td
                    className={`px-4 py-2 font-mono text-center font-bold ${regressionRisk[idx] > 60 ? "text-red-600" : regressionRisk[idx] > 40 ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {regressionRisk[idx].toFixed(0)}%
                  </td>
                  <td
                    className={`px-4 py-2 font-mono text-center font-bold ${breakingChangeRisk[idx] > 60 ? "text-red-600" : breakingChangeRisk[idx] > 30 ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {breakingChangeRisk[idx].toFixed(0)}%
                  </td>
                  <td
                    className={`px-4 py-2 font-mono text-center font-bold ${releaseConfidence[idx] > 75 ? "text-emerald-600" : releaseConfidence[idx] > 50 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {releaseConfidence[idx].toFixed(0)}%
                  </td>
                  <td className="px-4 py-2 font-mono text-right text-slate-900">
                    {period.codeChurn}
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-900 text-center">
                    {period.entropy.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 font-mono text-right text-slate-900">
                    {period.commitCount}
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
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${selectedPeriod ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <div className="h-14 border-b border-slate-200 flex items-center px-5 shrink-0">
            <h2 className="text-sm font-medium text-slate-900">
              Evolution Analysis
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Trend Summary
                </p>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Risk Trend</span>
                    <span
                      className={`font-mono ${parseFloat(riskTrend) > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {parseFloat(riskTrend) > 0 ? "+" : ""}
                      {riskTrend}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vulnerability Accumulation</span>
                    <span className="font-mono text-red-600">
                      +{vulnerabilityTrend}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entropy Change</span>
                    <span
                      className={`font-mono ${parseFloat(entropyTrend) > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {parseFloat(entropyTrend) > 0 ? "+" : ""}
                      {entropyTrend}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Structural Changes
                </p>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Dependency Growth</span>
                    <span className="font-mono">+{dependencyGrowth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Structural Drift</span>
                    <span className="font-mono">{structuralDrift}%</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Activity
                </p>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Total Commits</span>
                    <span className="font-mono">{totalCommits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modules Changed</span>
                    <span className="font-mono">{totalModulesChanged}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Recommendations
                </p>
                <div className="text-xs text-slate-600 leading-relaxed">
                  Risk trend is increasing. Entropy is rising, indicating
                  growing complexity. Prioritize stabilization in next release.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${selectedPeriod ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {selectedPeriod ? (
            <>
              <div className="h-14 border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
                <h2 className="text-sm font-medium text-slate-900">
                  Version Details
                </h2>
                <button
                  onClick={() => setSelectedPeriodId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Version</p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {selectedPeriod.version}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Release Date</p>
                    <p className="text-sm text-slate-900">
                      {selectedPeriod.date}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                    <p
                      className={`text-lg font-mono font-bold ${selectedPeriod.riskScore > 60 ? "text-red-600" : selectedPeriod.riskScore > 40 ? "text-amber-600" : "text-emerald-600"}`}
                    >
                      {selectedPeriod.riskScore}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Metrics
                    </p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Entropy</span>
                        <span className="font-mono">
                          {selectedPeriod.entropy.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dependencies</span>
                        <span className="font-mono">
                          {selectedPeriod.dependency_count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vulnerabilities</span>
                        <span className="font-mono">
                          {selectedPeriod.vulnerability_accumulation}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Development Activity
                    </p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Commits</span>
                        <span className="font-mono">
                          {selectedPeriod.commitCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modules Changed</span>
                        <span className="font-mono">
                          {selectedPeriod.modulesChanged}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Commit Size</span>
                        <span className="font-mono">
                          {selectedPeriod.avgCommitSize.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 10 UNIQUE FEATURES IN INSPECTOR */}
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Advanced Metrics
                    </p>
                    <div className="space-y-2 text-xs">
                      {/* Feature 1: Volatility */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Volatility Index</span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-200 rounded h-1.5">
                            <div
                              className="bg-slate-500 h-1.5 rounded transition-all"
                              style={{
                                width: `${Math.min(100, (volatilityIndex[selectedPeriod.id - 1] / 100) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono text-slate-900 w-8">
                            {volatilityIndex[selectedPeriod.id - 1].toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Feature 2: Velocity */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Release Velocity</span>
                        <span className="font-mono text-slate-900">
                          {releaseVelocity[selectedPeriod.id - 1]} commits/day
                        </span>
                      </div>

                      {/* Feature 3: Regression Risk */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Regression Risk</span>
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              regressionRisk[selectedPeriod.id - 1] > 60
                                ? "bg-red-100 text-red-700"
                                : regressionRisk[selectedPeriod.id - 1] > 40
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {regressionRisk[selectedPeriod.id - 1].toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {/* Feature 4: Breaking Change Risk */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">
                          Breaking Change Risk
                        </span>
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              breakingChangeRisk[selectedPeriod.id - 1] > 60
                                ? "bg-red-100 text-red-700"
                                : breakingChangeRisk[selectedPeriod.id - 1] > 30
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {breakingChangeRisk[selectedPeriod.id - 1].toFixed(
                              0,
                            )}
                            %
                          </div>
                        </div>
                      </div>

                      {/* Feature 5: Health Score */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Health Score</span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-200 rounded h-1.5">
                            <div
                              className={`h-1.5 rounded transition-all ${
                                healthScore[selectedPeriod.id - 1] > 70
                                  ? "bg-emerald-500"
                                  : healthScore[selectedPeriod.id - 1] > 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${(healthScore[selectedPeriod.id - 1] / 100) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono text-slate-900 w-8">
                            {healthScore[selectedPeriod.id - 1].toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Feature 6: Release Confidence */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">
                          Release Confidence
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-200 rounded h-1.5">
                            <div
                              className={`h-1.5 rounded transition-all ${
                                releaseConfidence[selectedPeriod.id - 1] > 75
                                  ? "bg-emerald-500"
                                  : releaseConfidence[selectedPeriod.id - 1] >
                                      50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${(releaseConfidence[selectedPeriod.id - 1] / 100) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono text-slate-900 w-8">
                            {releaseConfidence[selectedPeriod.id - 1].toFixed(
                              0,
                            )}
                            %
                          </span>
                        </div>
                      </div>

                      {/* Feature 7: Code Churn */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Code Churn</span>
                        <span className="font-mono text-slate-900">
                          {selectedPeriod.codeChurn} lines
                        </span>
                      </div>

                      {/* Feature 8: Coupling Index */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Coupling Index</span>
                        <span className="font-mono text-slate-900">
                          {couplingIndex[selectedPeriod.id - 1].toFixed(1)}
                        </span>
                      </div>

                      {/* Feature 9: Quadrant Position */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">
                          Stability/Velocity
                        </span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            stabilityVelocityQuadrant[selectedPeriod.id - 1]
                              .quadrant === "optimal"
                              ? "bg-emerald-100 text-emerald-700"
                              : stabilityVelocityQuadrant[selectedPeriod.id - 1]
                                    .quadrant === "fast-risky"
                                ? "bg-red-100 text-red-700"
                                : stabilityVelocityQuadrant[
                                      selectedPeriod.id - 1
                                    ].quadrant === "slow-stable"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {stabilityVelocityQuadrant[
                            selectedPeriod.id - 1
                          ].quadrant.replace("-", " ")}
                        </span>
                      </div>

                      {/* Feature 10: Entropy Prediction */}
                      {selectedPeriod.id === timePeriods.length && (
                        <div className="border-t border-slate-200 pt-2 mt-2">
                          <p className="text-slate-600 mb-1 font-medium">
                            Entropy Prediction
                          </p>
                          <div className="text-[10px] space-y-1 text-slate-600">
                            <div className="flex justify-between">
                              <span>Current</span>
                              <span className="font-mono">
                                {entropyPrediction.current}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Predicted (2 releases)</span>
                              <span className="font-mono">
                                {entropyPrediction.predicted}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Trajectory</span>
                              <span
                                className={`font-mono ${
                                  entropyPrediction.trajectory === "increasing"
                                    ? "text-red-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {entropyPrediction.trajectory}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rate</span>
                              <span className="font-mono">
                                {entropyPrediction.rate}/release
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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

export default RepositoryEvolution;
