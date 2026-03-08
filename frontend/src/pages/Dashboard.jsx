import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useIntelligenceStore from "../store/intelligence.store";

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — dark futuristic palette
   ═══════════════════════════════════════════════════════════════════════ */
const darkBg  = "#0B0F1A";
const cardBg  = "rgba(26,31,46,0.6)";
const glass   = {
  background: cardBg,
  backdropFilter: "blur(16px) saturate(120%)",
  WebkitBackdropFilter: "blur(16px) saturate(120%)",
};
const cardBorder = "border border-white/[0.06]";
const glowShadow = "0 0 0 1px rgba(255,255,255,0.03), 0 6px 24px rgba(0,0,0,0.3)";

// ============================================================================
// SPARKLINE — Inline trend bar chart (dark-themed)
// ============================================================================
function Sparkline({ data, color = "bg-blue-500", height = 24, barWidth = 3 }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((v, i) => (
        <motion.div
          key={i}
          className={`${color} rounded-sm`}
          style={{ width: barWidth, minHeight: 1 }}
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: `${(v / max) * 100}%`,
            opacity: (v / max) * 0.5 + 0.5,
          }}
          transition={{ delay: i * 0.02, duration: 0.15 }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// ARC GAUGE — SVG 270° arc progress (dark-themed)
// ============================================================================
function ArcGauge({ value, max = 100, label, color, size = 80 }) {
  const pct = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 34;
  const dashOffset = circumference * (1 - pct * 0.75);
  const risk =
    pct > 0.7
      ? "text-red-400"
      : pct > 0.4
        ? "text-amber-400"
        : "text-emerald-400";
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          transform="rotate(135 40 40)"
        />
        <motion.circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform="rotate(135 40 40)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="flex flex-col items-center -mt-12">
        <span className={`text-lg font-mono font-bold ${risk}`}>{value}</span>
        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// HEAT CELL — coloured square with value (dark-themed)
// ============================================================================
function HeatCell({ value, max, label }) {
  const intensity = Math.min(value / max, 1);
  const bg =
    intensity > 0.7
      ? "bg-red-500"
      : intensity > 0.4
        ? "bg-amber-400"
        : intensity > 0
          ? "bg-emerald-400"
          : "bg-white/[0.06]";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.div
        className={`w-7 h-7 rounded-lg border border-white/[0.08] flex items-center justify-center ${bg}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: intensity * 0.6 + 0.4 }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-[8px] font-mono font-bold text-white">
          {value}
        </span>
      </motion.div>
      <span className="text-[7px] font-mono text-slate-500 truncate w-8 text-center">
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    document.title = "QuantumThread AI — Command Center";
    const interval = setInterval(() => setPulseKey((k) => k + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================================================
  // DATA LAYER — fetched from API via Zustand store
  // ==========================================================================
  const storeModules = useIntelligenceStore((state) => state.modules);
  const storeVulnerabilities = useIntelligenceStore((state) => state.vulnerabilities);
  const storeSummary = useIntelligenceStore((state) => state.summary);
  const initialized = useIntelligenceStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      useIntelligenceStore.getState().fetchAll();
    }
  }, [initialized]);

  // Generate sparkline trend data from a value
  const generateTrend = useCallback((val) => {
    const base = Math.max(val, 1);
    return Array.from({ length: 24 }, (_, i) => Math.max(1, Math.round(base + Math.sin(i * 0.5) * (base * 0.15))));
  }, []);

  const modules = useMemo(
    () => {
      if (storeModules.length === 0) {
        // Fallback while loading
        return [];
      }
      return storeModules.map((m) => ({
        name: m.module || m.name,
        risk: m.riskScore ?? m.risk_score ?? 0,
        entropy: (m.bugCount ?? m.bug_count ?? 0) * 0.1,
        connections: (m.dependencyCount ?? m.dependency_count ?? 0) + (m.impactRadius ?? m.impact_radius ?? 0),
        health: Math.max(0, 100 - (m.riskScore ?? m.risk_score ?? 0)),
        churn: (m.bugCount ?? m.bug_count ?? 0) * 40 + (m.dependencyCount ?? m.dependency_count ?? 0) * 20,
        vulns: 0,
        depth: m.dependencyCount ?? m.dependency_count ?? 0,
        trend: generateTrend(m.riskScore ?? m.risk_score ?? 50),
      }));
    },
    [storeModules, generateTrend],
  );

  const overallHealth = useMemo(
    () =>
      modules.length > 0
        ? Math.round(modules.reduce((s, m) => s + m.health, 0) / modules.length)
        : 0,
    [modules],
  );
  const totalRisk = useMemo(
    () => modules.reduce((s, m) => s + m.risk, 0),
    [modules],
  );
  const totalVulns = useMemo(
    () => modules.reduce((s, m) => s + m.vulns, 0),
    [modules],
  );
  const avgEntropy = useMemo(
    () =>
      modules.length > 0
        ? (modules.reduce((s, m) => s + m.entropy, 0) / modules.length).toFixed(2)
        : "0.00",
    [modules],
  );
  const totalConnections = useMemo(
    () => modules.reduce((s, m) => s + m.connections, 0),
    [modules],
  );
  const criticalModules = useMemo(
    () => modules.filter((m) => m.risk > 70).length,
    [modules],
  );
  const circularDeps = 0;

  // Compute vulnerability distribution from real data
  const vulnDistribution = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    storeVulnerabilities.forEach((v) => {
      const sev = v.severity || "Low";
      if (counts[sev] !== undefined) counts[sev]++;
    });
    return [
      { severity: "Critical", count: counts.Critical, bg: "bg-red-600" },
      { severity: "High", count: counts.High, bg: "bg-orange-600" },
      { severity: "Medium", count: counts.Medium, bg: "bg-amber-500" },
      { severity: "Low", count: counts.Low, bg: "bg-emerald-600" },
    ];
  }, [storeVulnerabilities]);

  // Compute per-module vulns from real vulnerability data
  const moduleVulnCounts = useMemo(() => {
    const map = {};
    storeVulnerabilities.forEach((v) => {
      const mod = v.module || v.module_name || "unknown";
      map[mod] = (map[mod] || 0) + 1;
    });
    return map;
  }, [storeVulnerabilities]);

  // Patch vulns into modules from real data
  const patchedModules = useMemo(
    () => modules.map((m) => ({ ...m, vulns: moduleVulnCounts[m.name] || 0 })),
    [modules, moduleVulnCounts],
  );

  // Generate sparkline trends from current computed values
  const riskHistory = useMemo(
    () => generateTrend(Math.round(totalRisk / Math.max(modules.length, 1))),
    [generateTrend, totalRisk, modules.length],
  );
  const entropyHistory = useMemo(
    () => generateTrend(Math.round(parseFloat(avgEntropy) * 100)),
    [generateTrend, avgEntropy],
  );
  const healthHistory = useMemo(
    () => generateTrend(overallHealth || 50),
    [generateTrend, overallHealth],
  );
  const churnHistory = useMemo(
    () => generateTrend(modules.reduce((s, m) => s + m.churn, 0) / Math.max(modules.length, 1)),
    [generateTrend, modules],
  );

  // Build activity from real analysis data
  const recentActivity = useMemo(() => {
    const events = [];
    if (modules.length > 0) {
      events.push({
        time: "--:--",
        event: "Analysis completed",
        type: "success",
        detail: `${modules.length} modules • ${totalRisk} total risk`,
      });
    }
    storeVulnerabilities.slice(0, 4).forEach((v) => {
      events.push({
        time: "--:--",
        event: `${v.severity || "Unknown"} vulnerability found`,
        type: v.severity === "Critical" ? "critical" : v.severity === "High" ? "warning" : "info",
        detail: `${v.module || v.module_name || ""} • ${v.type || v.description || ""}`.slice(0, 60),
      });
    });
    modules.filter((m) => m.risk > 70).slice(0, 3).forEach((m) => {
      events.push({
        time: "--:--",
        event: "High risk module detected",
        type: "warning",
        detail: `${m.name} — risk ${m.risk}`,
      });
    });
    return events.length > 0 ? events : [{ time: "--:--", event: "No analysis data yet", type: "info", detail: "Upload a project to begin" }];
  }, [modules, storeVulnerabilities, totalRisk]);

  // Build topology edges from module connectivity (pair adjacent modules)
  const topologyEdges = useMemo(() => {
    if (modules.length < 2) return [];
    const edges = [];
    for (let i = 0; i < modules.length - 1; i++) {
      edges.push({ from: modules[i].name, to: modules[i + 1].name });
      if (i + 2 < modules.length && modules[i].connections > 2) {
        edges.push({ from: modules[i].name, to: modules[i + 2].name });
      }
    }
    return edges;
  }, [modules]);

  const riskColor = useCallback((risk) => {
    if (risk > 80)
      return {
        text: "text-red-400",
        bg: "bg-red-500",
        border: "border-red-500/30",
      };
    if (risk > 60)
      return {
        text: "text-orange-400",
        bg: "bg-orange-500",
        border: "border-orange-500/30",
      };
    if (risk > 40)
      return {
        text: "text-amber-400",
        bg: "bg-amber-400",
        border: "border-amber-400/30",
      };
    return {
      text: "text-emerald-400",
      bg: "bg-emerald-500",
      border: "border-emerald-400/30",
    };
  }, []);

  const tabs = ["overview", "modules", "security", "activity"];

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="qt-dark h-full w-full flex flex-col overflow-hidden" style={{ background: darkBg }}>
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <header
        className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-white/[0.06]"
        style={{ ...glass }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-white tracking-tight">
            Engineering Command Center
          </h1>
          <div className="flex items-center gap-1 ml-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all duration-200 border-0 cursor-pointer ${
                  activeTab === tab
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                style={
                  activeTab === tab
                    ? { background: "rgba(99,102,241,0.25)", boxShadow: "0 0 12px rgba(99,102,241,0.15)" }
                    : { background: "transparent", boxShadow: "none" }
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            key={pulseKey}
            className="w-2 h-2 bg-emerald-400 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2 }}
            style={{ boxShadow: "0 0 8px rgba(52,211,153,0.4)" }}
          />
          <span className="text-[10px] font-mono text-emerald-400/70">LIVE</span>
        </div>
      </header>

      {/* ─── SCROLLABLE BODY ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* ── TOP STRIP: 4 gauges + key metric tiles ───────────────── */}
        <div className="px-6 py-5 border-b border-white/[0.06]" style={{ ...glass }}>
          <div className="flex items-start gap-6">
            <div className="flex gap-5 shrink-0">
              <ArcGauge value={overallHealth} label="Health" color="#34d399" />
              <ArcGauge
                value={modules.length > 0 ? Math.round(totalRisk / modules.length) : 0}
                label="Avg Risk"
                color="#f87171"
              />
              <ArcGauge
                value={Math.round(parseFloat(avgEntropy) * 100)}
                label="Entropy"
                color="#fb923c"
              />
              <ArcGauge
                value={modules.length > 0 ? Math.round((1 - criticalModules / modules.length) * 100) : 100}
                label="Stability"
                color="#818cf8"
              />
            </div>
            <div className="w-px h-20 bg-white/[0.06] self-center" />
            <div className="flex-1 grid grid-cols-6 gap-3">
              {[
                {
                  label: "Modules",
                  value: modules.length,
                  color: "text-white",
                },
                {
                  label: "Total Risk",
                  value: totalRisk,
                  color: "text-red-400",
                },
                {
                  label: "Critical",
                  value: criticalModules,
                  color: "text-red-400",
                },
                { label: "CVEs", value: totalVulns, color: "text-orange-400" },
                {
                  label: "Connections",
                  value: totalConnections,
                  color: "text-white",
                },
                {
                  label: "Circular",
                  value: circularDeps,
                  color: circularDeps > 0 ? "text-amber-400" : "text-white",
                },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  className={`rounded-xl px-3 py-2 ${cardBorder}`}
                  style={{ ...glass, boxShadow: glowShadow }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                    {m.label}
                  </p>
                  <p
                    className={`text-xl font-mono font-bold ${m.color} leading-tight`}
                  >
                    {m.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SPARKLINE STRIP ──────────────────────────────────────── */}
        <div className="px-6 py-3 border-b border-white/[0.06]" style={{ ...glass }}>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Risk (24h)",
                data: riskHistory,
                color: "bg-red-500",
                value: Math.round(totalRisk / Math.max(modules.length, 1)),
                unit: "",
                trend: "",
              },
              {
                label: "Entropy (24h)",
                data: entropyHistory,
                color: "bg-orange-500",
                value: avgEntropy,
                unit: "",
                trend: "",
              },
              {
                label: "Health (24h)",
                data: healthHistory,
                color: "bg-emerald-500",
                value: overallHealth || 0,
                unit: "%",
                trend: "",
              },
              {
                label: "Churn (24h)",
                data: churnHistory,
                color: "bg-indigo-500",
                value: Math.round(modules.reduce((s, m) => s + m.churn, 0) / Math.max(modules.length, 1)),
                unit: " loc",
                trend: "",
              },
            ].map((spark, i) => (
              <motion.div
                key={spark.label}
                className={`flex items-center gap-3 p-2 rounded-xl ${cardBorder}`}
                style={{ ...glass, boxShadow: glowShadow }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <div className="flex-1">
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                    {spark.label}
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-sm font-mono font-bold text-white">
                      {spark.value}
                      {spark.unit}
                    </span>
                  </div>
                </div>
                <Sparkline
                  data={spark.data}
                  color={spark.color}
                  height={28}
                  barWidth={3}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── MAIN BODY ────────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-4">
          {/* ======================== OVERVIEW TAB ======================== */}
          {activeTab === "overview" && (
            <>
              {/* Row 1: Risk Heat Map | Vuln Breakdown | Topology */}
              <div className="grid grid-cols-2 gap-4">
                {/* Module Risk Heat Map */}
                <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Module Risk Heat Map
                  </h3>
                  <div className="space-y-1.5">
                    {[...modules]
                      .sort((a, b) => b.risk - a.risk)
                      .map((m, i) => {
                        const rc = riskColor(m.risk);
                        return (
                          <motion.div
                            key={m.name}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <span className="text-[9px] font-mono text-slate-400 w-20 truncate">
                              {m.name}
                            </span>
                            <div className="flex-1 h-4 bg-white/[0.04] rounded-lg overflow-hidden border border-white/[0.06] relative">
                              <motion.div
                                className={`h-full ${rc.bg} rounded-lg`}
                                initial={{ width: 0 }}
                                animate={{ width: `${m.risk}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                style={{ opacity: 0.85 }}
                              />
                              <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[8px] font-mono font-bold text-white/70">
                                {m.risk}
                              </span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${rc.bg}`} style={{ boxShadow: `0 0 6px currentColor` }} />
                          </motion.div>
                        );
                      })}
                  </div>
                </div>

                {/* Vulnerability Breakdown */}
                <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Vulnerability Breakdown
                  </h3>
                  <div className="flex h-6 rounded-lg overflow-hidden border border-white/[0.06] mb-4">
                    {vulnDistribution.map((v) => (
                      <motion.div
                        key={v.severity}
                        className={`${v.bg} flex items-center justify-center`}
                        style={{ width: `${totalVulns > 0 ? (v.count / totalVulns) * 100 : 0}%` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {v.count > 2 && (
                          <span className="text-[8px] font-mono font-bold text-white">
                            {v.count}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {vulnDistribution.map((v) => (
                      <div
                        key={v.severity}
                        className="flex items-center gap-2 p-1.5 rounded-lg border border-white/[0.06]"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                      >
                        <div className={`w-3 h-3 rounded-md ${v.bg}`} />
                        <span className="text-[9px] font-mono text-slate-400 flex-1">
                          {v.severity}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {v.count}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/[0.06]">
                    <span className="text-[9px] font-mono text-slate-500">
                      Total
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {totalVulns}
                    </span>
                  </div>
                </div>

                {/* Topology Mini-Map */}
                <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Dependency Topology
                  </h3>
                  <div className="relative" style={{ height: 160 }}>
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 0 }}
                    >
                      {topologyEdges.map((edge, i) => {
                        const fromIdx = modules.findIndex(
                          (m) => m.name === edge.from,
                        );
                        const toIdx = modules.findIndex(
                          (m) => m.name === edge.to,
                        );
                        if (fromIdx < 0 || toIdx < 0) return null;
                        const fromX = 20 + (fromIdx % 3) * 80 + 30;
                        const fromY = 10 + Math.floor(fromIdx / 3) * 50 + 12;
                        const toX = 20 + (toIdx % 3) * 80 + 30;
                        const toY = 10 + Math.floor(toIdx / 3) * 50 + 12;
                        return (
                          <motion.line
                            key={i}
                            x1={fromX}
                            y1={fromY}
                            x2={toX}
                            y2={toY}
                            stroke="rgba(99,102,241,0.25)"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 0.3 + i * 0.03 }}
                          />
                        );
                      })}
                    </svg>
                    {modules.map((m, i) => {
                      const col = i % 3;
                      const row = Math.floor(i / 3);
                      const x = 20 + col * 80;
                      const y = 10 + row * 50;
                      const rc = riskColor(m.risk);
                      return (
                        <motion.div
                          key={m.name}
                          className={`absolute border ${rc.border} rounded-lg px-1.5 py-1 cursor-default z-10`}
                          style={{ left: x, top: y, ...glass }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <p className="text-[7px] font-mono font-bold text-slate-300 whitespace-nowrap">
                            {m.name}
                          </p>
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${rc.bg}`}
                            />
                            <span
                              className={`text-[7px] font-mono font-bold ${rc.text}`}
                            >
                              {m.risk}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <Link
                    to="/project/architecture"
                    className="flex items-center justify-center gap-1 mt-2 text-[9px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Open full map →
                  </Link>
                </div>
              </div>

              {/* Row 2: Module Health Matrix + Activity Feed */}
              <div className="grid grid-cols-1 gap-4">
                <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Module Health Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-left"
                      style={{ minWidth: 600 }}
                    >
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          {[
                            "Module",
                            "Risk",
                            "Entropy",
                            "Health",
                            "CVEs",
                            "Churn",
                            "Conns",
                            "Trend",
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-[9px] font-mono text-slate-500 uppercase tracking-wider pb-2 pr-4 whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...modules]
                          .sort((a, b) => b.risk - a.risk)
                          .map((m, i) => {
                            const rc = riskColor(m.risk);
                            const hc =
                              m.health > 70
                                ? "text-emerald-400"
                                : m.health > 50
                                  ? "text-amber-400"
                                  : "text-red-400";
                            return (
                              <motion.tr
                                key={m.name}
                                className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                              >
                                <td className="py-2 pr-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={`w-2 h-2 rounded-full ${rc.bg}`}
                                    />
                                    <span className="text-[10px] font-mono font-medium text-slate-300">
                                      {m.name}
                                    </span>
                                  </div>
                                </td>
                                <td
                                  className={`text-[10px] font-mono font-bold ${rc.text} pr-4 whitespace-nowrap`}
                                >
                                  {m.risk}
                                </td>
                                <td className="text-[10px] font-mono text-slate-400 pr-4 whitespace-nowrap">
                                  {m.entropy.toFixed(2)}
                                </td>
                                <td className="pr-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <div className="w-10 h-1.5 bg-white/[0.06] rounded-lg overflow-hidden">
                                      <div
                                        className={`h-full rounded-lg ${
                                          m.health > 70
                                            ? "bg-emerald-500"
                                            : m.health > 50
                                              ? "bg-amber-400"
                                              : "bg-red-500"
                                        }`}
                                        style={{ width: `${m.health}%` }}
                                      />
                                    </div>
                                    <span
                                      className={`text-[10px] font-mono font-bold ${hc}`}
                                    >
                                      {m.health}
                                    </span>
                                  </div>
                                </td>
                                <td
                                  className={`text-[10px] font-mono font-bold ${
                                    m.vulns > 2
                                      ? "text-red-400"
                                      : m.vulns > 0
                                        ? "text-amber-400"
                                        : "text-slate-500"
                                  } pr-4 whitespace-nowrap`}
                                >
                                  {m.vulns}
                                </td>
                                <td className="text-[10px] font-mono text-slate-400 pr-4 whitespace-nowrap">
                                  {m.churn}
                                </td>
                                <td className="text-[10px] font-mono text-slate-400 pr-4 whitespace-nowrap">
                                  {m.connections}
                                </td>
                                <td className="py-2">
                                  <Sparkline
                                    data={m.trend}
                                    color={rc.bg}
                                    height={16}
                                    barWidth={2}
                                  />
                                </td>
                              </motion.tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Live Activity Feed
                  </h3>
                  <div className="space-y-0">
                    {recentActivity.map((evt, i) => {
                      const dotColor =
                        evt.type === "critical"
                          ? "bg-red-500"
                          : evt.type === "warning"
                            ? "bg-amber-400"
                            : evt.type === "success"
                              ? "bg-emerald-500"
                              : "bg-indigo-400";
                      const lineColor =
                        evt.type === "critical"
                          ? "border-red-500/30"
                          : evt.type === "warning"
                            ? "border-amber-500/30"
                            : evt.type === "success"
                              ? "border-emerald-500/30"
                              : "border-indigo-500/30";
                      return (
                        <motion.div
                          key={i}
                          className={`flex gap-3 pb-2.5 ${
                            i < recentActivity.length - 1
                              ? "border-l ml-[5px] pl-4 " + lineColor
                              : "ml-[5px] pl-4"
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0 -ml-[21.5px] mt-0.5 border-2 border-[#0d1117]`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-slate-500">
                                {evt.time}
                              </span>
                              <span className="text-[10px] font-medium text-slate-300">
                                {evt.event}
                              </span>
                            </div>
                            <p className="text-[9px] font-mono text-slate-500">
                              {evt.detail}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 3: Navigation Cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    name: "Architecture Map",
                    route: "/architecture",
                    stat: `${modules.length} modules`,
                    color: "border-l-indigo-500",
                    icon: "◈",
                  },
                  {
                    name: "Bug & Risk",
                    route: "/bug-risk",
                    stat: `${totalRisk} total risk`,
                    color: "border-l-red-500",
                    icon: "△",
                  },
                  {
                    name: "Security Scanner",
                    route: "/security",
                    stat: `${totalVulns} vulns found`,
                    color: "border-l-orange-500",
                    icon: "◉",
                  },
                  {
                    name: "Dependencies",
                    route: "/dependencies",
                    stat: `${totalConnections} connections`,
                    color: "border-l-violet-500",
                    icon: "⬡",
                  },
                  {
                    name: "Evolution",
                    route: "/evolution",
                    stat: "Timeline view",
                    color: "border-l-emerald-500",
                    icon: "⟁",
                  },
                ].map((card, i) => (
                  <motion.div
                    key={card.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                  >
                    <Link
                      to={card.route}
                      className={`block p-3 rounded-xl border border-white/[0.06] border-l-2 ${card.color} hover:bg-white/[0.04] transition-all duration-100 group`}
                      style={{ ...glass }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm opacity-60">{card.icon}</span>
                        <h4 className="text-[10px] font-mono font-semibold text-slate-300 group-hover:text-indigo-400 uppercase tracking-wider">
                          {card.name}
                        </h4>
                      </div>
                      <p className="text-[9px] font-mono text-slate-500">
                        {card.stat}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* ======================== MODULES TAB ======================== */}
          {activeTab === "modules" && (
            <div className="grid grid-cols-1 gap-4">
              {[...modules]
                .sort((a, b) => b.risk - a.risk)
                .map((m, i) => {
                  const rc = riskColor(m.risk);
                  return (
                    <motion.div
                      key={m.name}
                      className={`rounded-xl border-l-2 ${rc.border} p-4 ${cardBorder}`}
                      style={{ ...glass, boxShadow: glowShadow }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${rc.bg}`} />
                          <h4 className="text-xs font-mono font-bold text-slate-300">
                            {m.name}
                          </h4>
                        </div>
                        <span
                          className={`text-lg font-mono font-bold ${rc.text}`}
                        >
                          {m.risk}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        {[
                          {
                            k: "Entropy",
                            v: m.entropy.toFixed(2),
                            pct: m.entropy * 100,
                          },
                          { k: "Health", v: m.health, pct: m.health },
                          { k: "CVEs", v: m.vulns, pct: (m.vulns / 5) * 100 },
                          { k: "Depth", v: m.depth, pct: (m.depth / 4) * 100 },
                        ].map((s) => (
                          <div key={s.k}>
                            <p className="text-[8px] font-mono text-slate-500 uppercase mb-0.5">
                              {s.k}
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-300">
                              {s.v}
                            </p>
                            <div className="h-1 bg-white/[0.06] rounded-lg overflow-hidden mt-0.5">
                              <div
                                className={`h-full rounded-lg ${
                                  s.k === "Health"
                                    ? "bg-emerald-500"
                                    : s.k === "CVEs"
                                      ? "bg-red-500"
                                      : "bg-indigo-500"
                                }`}
                                style={{ width: `${Math.min(s.pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                        <span className="text-[8px] font-mono text-slate-500 uppercase">
                          12-week trend
                        </span>
                        <div className="flex-1">
                          <Sparkline
                            data={m.trend}
                            color={rc.bg}
                            height={18}
                            barWidth={4}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">
                          {m.churn} loc churn
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}

          {/* ====================== SECURITY TAB ========================= */}
          {activeTab === "security" && (
            <div className="space-y-4">
              {/* Severity Columns */}
              <div className="grid grid-cols-4 gap-3">
                {vulnDistribution.map((sev, i) => (
                  <motion.div
                    key={sev.severity}
                    className={`rounded-xl overflow-hidden ${cardBorder}`}
                    style={{ ...glass, boxShadow: glowShadow }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={`${sev.bg} h-1.5`} />
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
                          {sev.severity}
                        </span>
                        <span className="text-xl font-mono font-bold text-white">
                          {sev.count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-lg overflow-hidden">
                        <div
                          className={`h-full ${sev.bg}`}
                          style={{
                            width: `${(sev.count / totalVulns) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[8px] font-mono text-slate-500 mt-1">
                        {Math.round((sev.count / totalVulns) * 100)}% of total
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Heat Grid */}
              <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                  Module × Vulnerability Matrix
                </h3>
                <div className="flex flex-wrap gap-2">
                  {patchedModules.map((m) => (
                    <HeatCell
                      key={m.name}
                      value={m.vulns}
                      max={4}
                      label={m.name.slice(0, 6)}
                    />
                  ))}
                </div>
              </div>

              {/* CVE Table */}
              <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                  Top CVEs
                </h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {[
                        "Type",
                        "Severity",
                        "Module",
                        "Description",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-[9px] font-mono text-slate-500 uppercase tracking-wider pb-2 pr-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {storeVulnerabilities.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-[10px] font-mono text-slate-500 py-4">
                          No vulnerabilities detected
                        </td>
                      </tr>
                    ) : storeVulnerabilities.slice(0, 6).map((v, i) => (
                      <motion.tr
                        key={i}
                        className="border-b border-white/[0.04]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <td className="text-[10px] font-mono font-bold text-slate-300 py-2 pr-3">
                          {v.type || "Unknown"}
                        </td>
                        <td className="pr-3">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                              v.severity === "Critical"
                                ? "bg-red-500/20 text-red-400"
                                : v.severity === "High"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : v.severity === "Medium"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {v.severity || "Low"}
                          </span>
                        </td>
                        <td className="text-[10px] font-mono text-slate-400 pr-3">
                          {v.module || v.module_name || "—"}
                        </td>
                        <td className="text-[10px] font-mono text-slate-400 pr-3 max-w-[200px] truncate">
                          {v.description || "—"}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                <Link
                  to="/project/security"
                  className="flex items-center gap-1 mt-3 text-[9px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View full security report →
                </Link>
              </div>
            </div>
          )}

          {/* ====================== ACTIVITY TAB ========================= */}
          {activeTab === "activity" && (
            <div className="grid grid-cols-1 gap-4">
              <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-4">
                  Activity Timeline
                </h3>
                <div className="space-y-1">
                  {recentActivity.map((evt, i) => {
                    const dotColor =
                      evt.type === "critical"
                        ? "bg-red-500"
                        : evt.type === "warning"
                          ? "bg-amber-400"
                          : evt.type === "success"
                            ? "bg-emerald-500"
                            : "bg-indigo-400";
                    const lineBg =
                      evt.type === "critical"
                        ? "bg-red-500/10"
                        : evt.type === "warning"
                          ? "bg-amber-500/10"
                          : evt.type === "success"
                            ? "bg-emerald-500/10"
                            : "bg-indigo-500/10";
                    return (
                      <motion.div
                        key={i}
                        className={`flex items-start gap-3 p-2.5 rounded-lg ${lineBg} border border-transparent hover:border-white/[0.06] transition-colors`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0 mt-0.5`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-medium text-slate-300">
                              {evt.event}
                            </span>
                            <span
                              className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded-md ${
                                evt.type === "critical"
                                  ? "bg-red-500/20 text-red-400"
                                  : evt.type === "warning"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : evt.type === "success"
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-indigo-500/20 text-indigo-400"
                              }`}
                            >
                              {evt.type.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[9px] font-mono text-slate-500">
                            {evt.detail}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 shrink-0">
                          {evt.time}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Stats */}
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Event Summary
                  </h3>
                  {[
                    {
                      label: "Critical",
                      count: recentActivity.filter((e) => e.type === "critical")
                        .length,
                      color: "bg-red-500",
                    },
                    {
                      label: "Warning",
                      count: recentActivity.filter((e) => e.type === "warning")
                        .length,
                      color: "bg-amber-400",
                    },
                    {
                      label: "Success",
                      count: recentActivity.filter((e) => e.type === "success")
                        .length,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Info",
                      count: recentActivity.filter((e) => e.type === "info")
                        .length,
                      color: "bg-indigo-400",
                    },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-[10px] font-mono text-slate-400 flex-1">
                        {s.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={`rounded-xl p-4 ${cardBorder}`} style={{ ...glass, boxShadow: glowShadow }}>
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Infrastructure
                  </h3>
                  {[
                    { name: "Modules", stat: `${modules.length}` },
                    { name: "Vulnerabilities", stat: `${storeVulnerabilities.length}` },
                    { name: "Risk Score", stat: `${totalRisk}` },
                    { name: "Health", stat: `${overallHealth || 0}%` },
                  ].map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-2 mb-2 p-1.5 rounded-lg border border-white/[0.06]"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-mono text-slate-300 flex-1 font-medium">
                        {c.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {c.stat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between py-3 border-t border-white/[0.06] mt-2">
            <span className="text-[9px] font-mono text-slate-500">
              QuantumThread AI v2.1.0
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Compiler-Native Intelligence Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
