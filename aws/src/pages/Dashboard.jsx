import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// ============================================================================
// SPARKLINE — Inline trend bar chart
// ============================================================================
function Sparkline({ data, color = "bg-blue-500", height = 24, barWidth = 3 }) {
  const max = Math.max(...data);
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
// ARC GAUGE — SVG 270° arc progress
// ============================================================================
function ArcGauge({ value, max = 100, label, color, size = 80 }) {
  const pct = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 34;
  const dashOffset = circumference * (1 - pct * 0.75);
  const risk =
    pct > 0.7
      ? "text-red-600"
      : pct > 0.4
        ? "text-amber-600"
        : "text-emerald-600";
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="#e2e8f0"
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
// HEAT CELL — coloured square with value
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
          : "bg-slate-200";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.div
        className={`w-7 h-7 rounded-sm border border-slate-300 flex items-center justify-center ${bg}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: intensity * 0.6 + 0.4 }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-[8px] font-mono font-bold text-white">
          {value}
        </span>
      </motion.div>
      <span className="text-[7px] font-mono text-slate-400 truncate w-8 text-center">
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
  // DATA LAYER
  // ==========================================================================
  const modules = useMemo(
    () => [
      {
        name: "auth-core",
        risk: 72,
        entropy: 0.68,
        connections: 11,
        health: 58,
        churn: 340,
        vulns: 2,
        depth: 0,
        trend: [3, 5, 4, 7, 6, 8, 5, 9, 7, 6, 8, 7],
      },
      {
        name: "api-gateway",
        risk: 85,
        entropy: 0.74,
        connections: 17,
        health: 42,
        churn: 520,
        vulns: 3,
        depth: 1,
        trend: [4, 6, 5, 8, 9, 7, 10, 8, 11, 9, 8, 12],
      },
      {
        name: "crypto-lib",
        risk: 35,
        entropy: 0.32,
        connections: 7,
        health: 82,
        churn: 120,
        vulns: 1,
        depth: 2,
        trend: [2, 3, 2, 3, 2, 4, 3, 2, 3, 2, 3, 2],
      },
      {
        name: "event-stream",
        risk: 91,
        entropy: 0.81,
        connections: 21,
        health: 35,
        churn: 680,
        vulns: 4,
        depth: 1,
        trend: [5, 7, 6, 9, 8, 11, 10, 12, 9, 13, 11, 14],
      },
      {
        name: "http-client",
        risk: 48,
        entropy: 0.45,
        connections: 9,
        health: 71,
        churn: 210,
        vulns: 1,
        depth: 2,
        trend: [3, 4, 3, 5, 4, 5, 4, 6, 5, 4, 5, 4],
      },
      {
        name: "logging-lib",
        risk: 22,
        entropy: 0.19,
        connections: 4,
        health: 91,
        churn: 80,
        vulns: 0,
        depth: 3,
        trend: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
      },
      {
        name: "config-mgr",
        risk: 61,
        entropy: 0.58,
        connections: 8,
        health: 63,
        churn: 290,
        vulns: 2,
        depth: 2,
        trend: [3, 4, 5, 4, 6, 5, 7, 5, 6, 7, 5, 6],
      },
    ],
    [],
  );

  const overallHealth = useMemo(
    () =>
      Math.round(modules.reduce((s, m) => s + m.health, 0) / modules.length),
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
      (modules.reduce((s, m) => s + m.entropy, 0) / modules.length).toFixed(2),
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
  const circularDeps = 2;

  // 24-hour history sparklines
  const riskHistory = [
    38, 41, 39, 44, 42, 48, 45, 52, 49, 55, 52, 58, 54, 52, 56, 53, 51, 54, 52,
    50, 53, 51, 49, 52,
  ];
  const entropyHistory = [
    38, 40, 42, 41, 44, 43, 46, 48, 47, 50, 49, 52, 51, 50, 53, 52, 54, 53, 55,
    54, 55, 54, 55, 55,
  ];
  const healthHistory = [
    78, 76, 77, 74, 75, 72, 73, 70, 71, 68, 70, 67, 69, 68, 66, 68, 67, 66, 68,
    67, 65, 66, 67, 68,
  ];
  const churnHistory = [
    120, 145, 130, 180, 160, 200, 175, 220, 195, 240, 210, 260, 230, 250, 270,
    245, 280, 260, 290, 275, 300, 285, 310, 290,
  ];

  const vulnDistribution = [
    { severity: "Critical", count: 3, bg: "bg-red-600" },
    { severity: "High", count: 5, bg: "bg-orange-600" },
    { severity: "Medium", count: 8, bg: "bg-amber-500" },
    { severity: "Low", count: 12, bg: "bg-emerald-600" },
  ];

  const recentActivity = [
    {
      time: "14:32",
      event: "Full analysis completed",
      type: "success",
      detail: "7 modules • 438 risk",
    },
    {
      time: "14:28",
      event: "CVE-2024-1234 detected",
      type: "critical",
      detail: "auth-core • RCE via JWT",
    },
    {
      time: "14:15",
      event: "Circular dependency found",
      type: "warning",
      detail: "api-gateway ↔ event-stream",
    },
    {
      time: "13:58",
      event: "Dependency drift +5",
      type: "info",
      detail: "Structural entropy ↑ 0.03",
    },
    {
      time: "13:42",
      event: "Module health drop",
      type: "warning",
      detail: "event-stream 42→35",
    },
    {
      time: "13:30",
      event: "Security scan passed",
      type: "success",
      detail: "crypto-lib • 0 new CVEs",
    },
    {
      time: "13:15",
      event: "Hub overload alert",
      type: "critical",
      detail: "event-stream 21 connections",
    },
    {
      time: "13:02",
      event: "Release confidence low",
      type: "warning",
      detail: "v2.4.0 at 54% confidence",
    },
  ];

  const topologyEdges = [
    { from: "auth-core", to: "api-gateway" },
    { from: "auth-core", to: "event-stream" },
    { from: "api-gateway", to: "event-stream" },
    { from: "crypto-lib", to: "auth-core" },
    { from: "crypto-lib", to: "http-client" },
    { from: "http-client", to: "api-gateway" },
    { from: "logging-lib", to: "crypto-lib" },
    { from: "config-mgr", to: "api-gateway" },
    { from: "config-mgr", to: "http-client" },
  ];

  const riskColor = useCallback((risk) => {
    if (risk > 80)
      return {
        text: "text-red-600",
        bg: "bg-red-600",
        border: "border-red-400",
      };
    if (risk > 60)
      return {
        text: "text-orange-600",
        bg: "bg-orange-500",
        border: "border-orange-400",
      };
    if (risk > 40)
      return {
        text: "text-amber-600",
        bg: "bg-amber-400",
        border: "border-amber-400",
      };
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-500",
      border: "border-emerald-400",
    };
  }, []);

  const tabs = ["overview", "modules", "security", "activity"];

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="h-full w-full bg-[#f8f9fb] flex flex-col overflow-hidden">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
            Engineering Command Center
          </h1>
          <div className="flex items-center gap-1 ml-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-all duration-100 ${
                  activeTab === tab
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            key={pulseKey}
            className="w-2 h-2 bg-emerald-500 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2 }}
          />
          <span className="text-[10px] font-mono text-slate-400">LIVE</span>
        </div>
      </header>

      {/* ─── SCROLLABLE BODY ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* ── TOP STRIP: 4 gauges + key metric tiles ───────────────── */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-6">
            <div className="flex gap-5 shrink-0">
              <ArcGauge value={overallHealth} label="Health" color="#059669" />
              <ArcGauge
                value={Math.round(totalRisk / modules.length)}
                label="Avg Risk"
                color="#dc2626"
              />
              <ArcGauge
                value={Math.round(avgEntropy * 100)}
                label="Entropy"
                color="#ea580c"
              />
              <ArcGauge
                value={Math.round((1 - criticalModules / modules.length) * 100)}
                label="Stability"
                color="#2563eb"
              />
            </div>
            <div className="w-px h-20 bg-slate-200 self-center" />
            <div className="flex-1 grid grid-cols-6 gap-3">
              {[
                {
                  label: "Modules",
                  value: modules.length,
                  color: "text-slate-900",
                },
                {
                  label: "Total Risk",
                  value: totalRisk,
                  color: "text-red-600",
                },
                {
                  label: "Critical",
                  value: criticalModules,
                  color: "text-red-600",
                },
                { label: "CVEs", value: totalVulns, color: "text-orange-600" },
                {
                  label: "Connections",
                  value: totalConnections,
                  color: "text-slate-900",
                },
                {
                  label: "Circular",
                  value: circularDeps,
                  color: circularDeps > 0 ? "text-amber-600" : "text-slate-900",
                },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
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
        <div className="bg-white border-b border-slate-200 px-6 py-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Risk (24h)",
                data: riskHistory,
                color: "bg-red-500",
                value: riskHistory.at(-1),
                unit: "",
                trend: "↑ +14",
              },
              {
                label: "Entropy (24h)",
                data: entropyHistory,
                color: "bg-orange-500",
                value: avgEntropy,
                unit: "",
                trend: "↑ +0.17",
              },
              {
                label: "Health (24h)",
                data: healthHistory,
                color: "bg-emerald-500",
                value: overallHealth,
                unit: "%",
                trend: "↓ -10",
              },
              {
                label: "Churn (24h)",
                data: churnHistory,
                color: "bg-blue-500",
                value: churnHistory.at(-1),
                unit: " loc",
                trend: "↑ +170",
              },
            ].map((spark, i) => (
              <motion.div
                key={spark.label}
                className="flex items-center gap-3 p-2 rounded-sm border border-slate-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <div className="flex-1">
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    {spark.label}
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {spark.value}
                      {spark.unit}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold ${
                        spark.trend.startsWith("↑") &&
                        spark.label.includes("Risk")
                          ? "text-red-500"
                          : spark.trend.startsWith("↓") &&
                              spark.label.includes("Health")
                            ? "text-red-500"
                            : spark.trend.startsWith("↑")
                              ? "text-amber-500"
                              : "text-emerald-500"
                      }`}
                    >
                      {spark.trend}
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
                <div className="bg-white border border-slate-200 rounded-sm p-4">
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
                            <span className="text-[9px] font-mono text-slate-600 w-20 truncate">
                              {m.name}
                            </span>
                            <div className="flex-1 h-4 bg-slate-100 rounded-sm overflow-hidden border border-slate-200 relative">
                              <motion.div
                                className={`h-full ${rc.bg} rounded-sm`}
                                initial={{ width: 0 }}
                                animate={{ width: `${m.risk}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                style={{ opacity: 0.85 }}
                              />
                              <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[8px] font-mono font-bold text-slate-700">
                                {m.risk}
                              </span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${rc.bg}`} />
                          </motion.div>
                        );
                      })}
                  </div>
                </div>

                {/* Vulnerability Breakdown */}
                <div className="bg-white border border-slate-200 rounded-sm p-4">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Vulnerability Breakdown
                  </h3>
                  <div className="flex h-6 rounded-sm overflow-hidden border border-slate-200 mb-4">
                    {vulnDistribution.map((v) => (
                      <motion.div
                        key={v.severity}
                        className={`${v.bg} flex items-center justify-center`}
                        style={{ width: `${(v.count / totalVulns) * 100}%` }}
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
                        className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-sm border border-slate-100"
                      >
                        <div className={`w-3 h-3 rounded-sm ${v.bg}`} />
                        <span className="text-[9px] font-mono text-slate-600 flex-1">
                          {v.severity}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {v.count}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200">
                    <span className="text-[9px] font-mono text-slate-400">
                      Total
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {totalVulns}
                    </span>
                  </div>
                </div>

                {/* Topology Mini-Map */}
                <div className="bg-white border border-slate-200 rounded-sm p-4">
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
                            stroke="#cbd5e1"
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
                          className={`absolute border ${rc.border} bg-white rounded-sm px-1.5 py-1 cursor-default z-10`}
                          style={{ left: x, top: y }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <p className="text-[7px] font-mono font-bold text-slate-700 whitespace-nowrap">
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
                    to="/architecture"
                    className="flex items-center justify-center gap-1 mt-2 text-[9px] font-mono text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Open full map →
                  </Link>
                </div>
              </div>

              {/* Row 2: Module Health Matrix + Activity Feed */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white border border-slate-200 rounded-sm p-4">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Module Health Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-left"
                      style={{ minWidth: 600 }}
                    >
                      <thead>
                        <tr className="border-b border-slate-200">
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
                              className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pb-2 pr-4 whitespace-nowrap"
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
                                ? "text-emerald-600"
                                : m.health > 50
                                  ? "text-amber-600"
                                  : "text-red-600";
                            return (
                              <motion.tr
                                key={m.name}
                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                              >
                                <td className="py-2 pr-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={`w-2 h-2 rounded-full ${rc.bg}`}
                                    />
                                    <span className="text-[10px] font-mono font-medium text-slate-900">
                                      {m.name}
                                    </span>
                                  </div>
                                </td>
                                <td
                                  className={`text-[10px] font-mono font-bold ${rc.text} pr-4 whitespace-nowrap`}
                                >
                                  {m.risk}
                                </td>
                                <td className="text-[10px] font-mono text-slate-700 pr-4 whitespace-nowrap">
                                  {m.entropy.toFixed(2)}
                                </td>
                                <td className="pr-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <div className="w-10 h-1.5 bg-slate-200 rounded-sm overflow-hidden">
                                      <div
                                        className={`h-full rounded-sm ${
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
                                      ? "text-red-600"
                                      : m.vulns > 0
                                        ? "text-amber-600"
                                        : "text-slate-400"
                                  } pr-4 whitespace-nowrap`}
                                >
                                  {m.vulns}
                                </td>
                                <td className="text-[10px] font-mono text-slate-600 pr-4 whitespace-nowrap">
                                  {m.churn}
                                </td>
                                <td className="text-[10px] font-mono text-slate-600 pr-4 whitespace-nowrap">
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
                <div className="bg-white border border-slate-200 rounded-sm p-4">
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
                              : "bg-blue-400";
                      const lineColor =
                        evt.type === "critical"
                          ? "border-red-200"
                          : evt.type === "warning"
                            ? "border-amber-200"
                            : evt.type === "success"
                              ? "border-emerald-200"
                              : "border-blue-200";
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
                            className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0 -ml-[21.5px] mt-0.5 border-2 border-white`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-slate-400">
                                {evt.time}
                              </span>
                              <span className="text-[10px] font-medium text-slate-900">
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
                    color: "border-l-blue-500",
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
                    stat: "6 releases tracked",
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
                      className={`block p-3 bg-white border border-slate-200 border-l-2 ${card.color} rounded-sm hover:bg-slate-50 transition-all duration-100 group`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm opacity-60">{card.icon}</span>
                        <h4 className="text-[10px] font-mono font-semibold text-slate-900 group-hover:text-blue-700 uppercase tracking-wider">
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
                      className={`bg-white border border-slate-200 border-l-2 ${rc.border} rounded-sm p-4`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${rc.bg}`} />
                          <h4 className="text-xs font-mono font-bold text-slate-900">
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
                            <p className="text-[8px] font-mono text-slate-400 uppercase mb-0.5">
                              {s.k}
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-800">
                              {s.v}
                            </p>
                            <div className="h-1 bg-slate-200 rounded-sm overflow-hidden mt-0.5">
                              <div
                                className={`h-full rounded-sm ${
                                  s.k === "Health"
                                    ? "bg-emerald-500"
                                    : s.k === "CVEs"
                                      ? "bg-red-500"
                                      : "bg-slate-600"
                                }`}
                                style={{ width: `${Math.min(s.pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <span className="text-[8px] font-mono text-slate-400 uppercase">
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
                    className="bg-white border border-slate-200 rounded-sm overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={`${sev.bg} h-1.5`} />
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-900 uppercase">
                          {sev.severity}
                        </span>
                        <span className="text-xl font-mono font-bold text-slate-900">
                          {sev.count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${sev.bg}`}
                          style={{
                            width: `${(sev.count / totalVulns) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[8px] font-mono text-slate-400 mt-1">
                        {Math.round((sev.count / totalVulns) * 100)}% of total
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Heat Grid */}
              <div className="bg-white border border-slate-200 rounded-sm p-4">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                  Module × Vulnerability Matrix
                </h3>
                <div className="flex flex-wrap gap-2">
                  {modules.map((m) => (
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
              <div className="bg-white border border-slate-200 rounded-sm p-4">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                  Top CVEs
                </h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {[
                        "CVE",
                        "Severity",
                        "Score",
                        "Library",
                        "Affected",
                        "Patch",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pb-2 pr-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        cve: "CVE-2024-1234",
                        sev: "Critical",
                        score: 9.8,
                        lib: "auth-core",
                        affected: 5,
                        patch: "1.5.3",
                      },
                      {
                        cve: "CVE-2024-5678",
                        sev: "High",
                        score: 7.2,
                        lib: "crypto-lib",
                        affected: 3,
                        patch: "2.3.2",
                      },
                      {
                        cve: "CVE-2024-9101",
                        sev: "High",
                        score: 6.5,
                        lib: "http-client",
                        affected: 7,
                        patch: "3.2.5",
                      },
                    ].map((cve, i) => (
                      <motion.tr
                        key={cve.cve}
                        className="border-b border-slate-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <td className="text-[10px] font-mono font-bold text-slate-900 py-2 pr-3">
                          {cve.cve}
                        </td>
                        <td className="pr-3">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                              cve.sev === "Critical"
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {cve.sev}
                          </span>
                        </td>
                        <td
                          className={`text-[10px] font-mono font-bold ${
                            cve.score > 8 ? "text-red-600" : "text-orange-600"
                          } pr-3`}
                        >
                          {cve.score}
                        </td>
                        <td className="text-[10px] font-mono text-slate-600 pr-3">
                          {cve.lib}
                        </td>
                        <td className="text-[10px] font-mono text-slate-600 pr-3">
                          {cve.affected}
                        </td>
                        <td className="text-[10px] font-mono text-emerald-600 pr-3">
                          {cve.patch}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                <Link
                  to="/security"
                  className="flex items-center gap-1 mt-3 text-[9px] font-mono text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View full security report →
                </Link>
              </div>
            </div>
          )}

          {/* ====================== ACTIVITY TAB ========================= */}
          {activeTab === "activity" && (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white border border-slate-200 rounded-sm p-4">
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
                            : "bg-blue-400";
                    const lineBg =
                      evt.type === "critical"
                        ? "bg-red-50"
                        : evt.type === "warning"
                          ? "bg-amber-50"
                          : evt.type === "success"
                            ? "bg-emerald-50"
                            : "bg-blue-50";
                    return (
                      <motion.div
                        key={i}
                        className={`flex items-start gap-3 p-2.5 rounded-sm ${lineBg} border border-transparent hover:border-slate-200 transition-colors`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0 mt-0.5`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-medium text-slate-900">
                              {evt.event}
                            </span>
                            <span
                              className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded-sm ${
                                evt.type === "critical"
                                  ? "bg-red-200 text-red-800"
                                  : evt.type === "warning"
                                    ? "bg-amber-200 text-amber-800"
                                    : evt.type === "success"
                                      ? "bg-emerald-200 text-emerald-800"
                                      : "bg-blue-200 text-blue-800"
                              }`}
                            >
                              {evt.type.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[9px] font-mono text-slate-500">
                            {evt.detail}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 shrink-0">
                          {evt.time}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Stats */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-sm p-4">
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
                      color: "bg-blue-400",
                    },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-[10px] font-mono text-slate-600 flex-1">
                        {s.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-sm p-4">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                    Infrastructure
                  </h3>
                  {[
                    { name: "Analyzer", stat: "124ms" },
                    { name: "Database", stat: "45d uptime" },
                    { name: "Cache", stat: "94.2% hit" },
                    { name: "Scanner", stat: "2m ago" },
                  ].map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-2 mb-2 p-1.5 bg-slate-50 rounded-sm border border-slate-100"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-mono text-slate-900 flex-1 font-medium">
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
          <div className="flex items-center justify-between py-3 border-t border-slate-200 mt-2">
            <span className="text-[9px] font-mono text-slate-400">
              QuantumThread AI v2.1.0
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              Compiler-Native Intelligence Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
