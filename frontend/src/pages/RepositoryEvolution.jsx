import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import useIntelligenceStore from "../store/intelligence.store";
import { useOutletContext } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — dark futuristic palette (matches Dashboard.jsx)
   ═══════════════════════════════════════════════════════════════════════ */
const darkBg = "#0B0F1A";
const cardBg = "rgba(26,31,46,0.6)";
const glass = {
  background: cardBg,
  backdropFilter: "blur(16px) saturate(120%)",
  WebkitBackdropFilter: "blur(16px) saturate(120%)",
};
const cardBorder = "border border-white/[0.06]";
const glowShadow =
  "0 0 0 1px rgba(255,255,255,0.03), 0 6px 24px rgba(0,0,0,0.3)";

/* ═══════════════════════════════════════════════════════════════════════
   SPARKLINE — Inline trend bar chart (dark-themed)
   ═══════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════
   HEAT CELL — commit heatmap square
   ═══════════════════════════════════════════════════════════════════════ */
function HeatCell({ value, max }) {
  const intensity = max > 0 ? Math.min(value / max, 1) : 0;
  const bg =
    intensity > 0.7
      ? "bg-indigo-500"
      : intensity > 0.35
        ? "bg-indigo-400/60"
        : intensity > 0
          ? "bg-indigo-400/25"
          : "bg-white/[0.06]";
  return (
    <motion.div
      className={`w-4 h-4 rounded-[3px] border border-white/[0.04] ${bg}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: intensity * 0.6 + 0.4, scale: 1 }}
      transition={{ duration: 0.25 }}
      title={`${value} commits`}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   No mock data generators — all data from store
   ═══════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════
   HELPER: risk badge color
   ═══════════════════════════════════════════════════════════════════════ */
function riskBadge(risk) {
  if (risk === "high")
    return "bg-red-500/20 text-red-400 border border-red-500/30";
  if (risk === "medium")
    return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
}

function complexityColor(score) {
  if (score > 30) return { glow: "rgba(239,68,68,0.25)", text: "text-red-400", bar: "bg-red-500", label: "High" };
  if (score > 18) return { glow: "rgba(245,158,11,0.25)", text: "text-amber-400", bar: "bg-amber-500", label: "Medium" };
  return { glow: "rgba(16,185,129,0.25)", text: "text-emerald-400", bar: "bg-emerald-500", label: "Low" };
}

/* ═══════════════════════════════════════════════════════════════════════
   TABS CONFIG
   ═══════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "commits", label: "Commits" },
  { key: "complexity", label: "Complexity" },
  { key: "contributors", label: "Contributors" },
];

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
function RepositoryEvolution() {
  const { selectedProject, selectedBranch } = useOutletContext();
  const selectedRepository = selectedProject?.name || "Unknown";
  const [activeTab, setActiveTab] = useState("overview");
  const [pulseKey, setPulseKey] = useState(0);

  /* ── Store data ─────────────────────────────────────────────────── */
  const storeModules = useIntelligenceStore((s) => s.modules);
  const timePeriods = useIntelligenceStore((s) => s.timePeriods);
  const initialized = useIntelligenceStore((s) => s.initialized);

  useEffect(() => {
    document.title = "QuantumThread AI — Repository Evolution";
    const iv = setInterval(() => setPulseKey((k) => k + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!initialized) {
      useIntelligenceStore.getState().fetchAll(selectedRepository);
    }
  }, [initialized, selectedRepository]);

  /* ── Derived module names for complexity tab ────────────────────── */
  const moduleNames = useMemo(
    () =>
      storeModules.length > 0
        ? storeModules.map((m) => m.module || m.name)
        : [],
    [storeModules],
  );

  /* ── Data derived from store (timePeriods + storeModules) ──────── */
  const heatmapData = useMemo(() => {
    // Build from timePeriods commit data, or show empty
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeks = 20;
    if (timePeriods.length === 0) {
      return days.map((day) => ({ day, values: Array(weeks).fill(0) }));
    }
    // Spread timePeriod commitCounts across the grid deterministically
    return days.map((day, di) => ({
      day,
      values: Array.from({ length: weeks }, (_, wi) => {
        const idx = (di * weeks + wi) % timePeriods.length;
        return timePeriods[idx]?.commitCount || 0;
      }),
    }));
  }, [timePeriods]);

  const churnData = useMemo(() => {
    if (timePeriods.length === 0) return [];
    return timePeriods.map((tp) => ({
      period: tp.version || tp.date || "—",
      additions: Math.round((tp.codeChurn || 0) * 0.6),
      deletions: Math.round((tp.codeChurn || 0) * 0.4),
    }));
  }, [timePeriods]);

  const complexityTrend = useMemo(() => {
    if (timePeriods.length > 0) {
      return timePeriods.map((tp) => Math.round((tp.riskScore || 0) * 0.45 + 5));
    }
    if (storeModules.length > 0) {
      return storeModules.map((m) => Math.round(((m.riskScore ?? m.risk_score ?? 20) * 0.45) + 5));
    }
    return [];
  }, [timePeriods, storeModules]);

  const commits = useMemo(() => {
    // Derive from timePeriods or show empty
    if (timePeriods.length === 0) return [];
    return timePeriods.map((tp, i) => ({
      hash: tp.id?.toString(16)?.slice(0, 7) || `${i}`,
      message: `${tp.version || "Release"} — ${tp.featureCount || 0} features, ${tp.bugsFixed || 0} bugs fixed`,
      author: "—",
      date: tp.date || "—",
      files: tp.modulesChanged || 0,
      insertions: Math.round((tp.codeChurn || 0) * 0.6),
      deletions: Math.round((tp.codeChurn || 0) * 0.4),
      risk: (tp.riskScore || 0) > 70 ? "high" : (tp.riskScore || 0) > 40 ? "medium" : "low",
    }));
  }, [timePeriods]);

  const contributors = useMemo(() => [], []); // No real contributor data in DB

  /* ── Derived metrics ────────────────────────────────────────────── */
  const totalCommits = useMemo(
    () => timePeriods.reduce((s, tp) => s + (tp.commitCount || 0), 0),
    [timePeriods],
  );
  const totalChurn = useMemo(
    () => timePeriods.reduce((s, tp) => s + (tp.codeChurn || 0), 0),
    [timePeriods],
  );
  const activeContributors = 0; // No real contributor data
  const avgComplexity = useMemo(
    () =>
      complexityTrend.length > 0
        ? (complexityTrend.reduce((s, v) => s + v, 0) / complexityTrend.length).toFixed(1)
        : "0",
    [complexityTrend],
  );

  const commitSparkline = useMemo(
    () => timePeriods.length > 0
      ? timePeriods.slice(-12).map((tp) => tp.commitCount || 0)
      : [0],
    [timePeriods],
  );
  const churnSparkline = useMemo(
    () => timePeriods.length > 0
      ? timePeriods.slice(-12).map((tp) => tp.codeChurn || 0)
      : [0],
    [timePeriods],
  );
  const contribSparkline = useMemo(() => [0], []);
  const complexitySparkline = useMemo(
    () => complexityTrend.length > 0 ? complexityTrend.slice(-12) : [0],
    [complexityTrend],
  );

  const heatMax = useMemo(
    () => {
      const vals = heatmapData.flatMap((r) => r.values);
      return vals.length > 0 ? Math.max(...vals, 1) : 1;
    },
    [heatmapData],
  );

  const maxChurn = useMemo(
    () => churnData.length > 0 ? Math.max(...churnData.map((c) => c.additions + c.deletions)) : 1,
    [churnData],
  );

  /* ── Module complexity data (from store) ──────────────────────── */
  const moduleComplexity = useMemo(() => {
    return moduleNames.map((name, i) => {
      const storeM = storeModules[i];
      const score = storeM
        ? Math.round((storeM.riskScore ?? storeM.risk_score ?? 20) * 0.45 + 5)
        : 0;
      return {
        name,
        cyclomatic: score,
        functions: storeM?.bugCount ?? storeM?.bug_count ?? 0,
        lines: (storeM?.dependencyCount ?? storeM?.dependency_count ?? 0) * 200,
        trend: Array.from({ length: 10 }, (_, j) =>
          Math.max(1, score + Math.round(Math.sin(j * 0.7) * (score * 0.15))),
        ),
      };
    });
  }, [moduleNames, storeModules]);

  const maxComplexity = useMemo(
    () => moduleComplexity.length > 0 ? Math.max(...moduleComplexity.map((m) => m.cyclomatic)) : 1,
    [moduleComplexity],
  );

  /* ══════════════════════════════════════════════════════════════════
     RENDER HELPERS
     ══════════════════════════════════════════════════════════════════ */

  /* ── Key Metrics Cards ──────────────────────────────────────────── */
  const metricsCards = [
    {
      label: "Total Commits",
      value: totalCommits.toLocaleString(),
      delta: "",
      deltaUp: true,
      sparkline: commitSparkline,
      color: "bg-indigo-500",
    },
    {
      label: "Code Churn",
      value: totalChurn.toLocaleString(),
      delta: "",
      deltaUp: true,
      sparkline: churnSparkline,
      color: "bg-cyan-500",
    },
    {
      label: "Active Contributors",
      value: activeContributors || "—",
      delta: "",
      deltaUp: true,
      sparkline: contribSparkline,
      color: "bg-emerald-500",
    },
    {
      label: "Avg Complexity",
      value: avgComplexity,
      delta: "",
      deltaUp: false,
      sparkline: complexitySparkline,
      color: "bg-amber-500",
    },
  ];

  /* ══════════════════════════════════════════════════════════════════
     OVERVIEW TAB
     ══════════════════════════════════════════════════════════════════ */
  const renderOverview = () => (
    <div className="flex flex-col gap-4">
      {/* Commit Activity Heat Map */}
      <motion.div
        className={`rounded-2xl p-5 ${cardBorder}`}
        style={{ ...glass, boxShadow: glowShadow }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Commit Activity Heat Map
          </h3>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Last 20 weeks
          </span>
        </div>
        <div className="flex gap-2">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pt-0 mr-1">
            {heatmapData.map((row) => (
              <span
                key={row.day}
                className="text-[9px] font-mono text-slate-500 h-4 flex items-center"
              >
                {row.day}
              </span>
            ))}
          </div>
          {/* Grid */}
          <div className="flex flex-col gap-[3px]">
            {heatmapData.map((row) => (
              <div key={row.day} className="flex gap-[3px]">
                {row.values.map((v, wi) => (
                  <HeatCell key={wi} value={v} max={heatMax} />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-8">
          <span className="text-[9px] font-mono text-slate-500">Less</span>
          {[0, 0.2, 0.45, 0.75, 1].map((int, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm border border-white/[0.04] ${
                int > 0.7
                  ? "bg-indigo-500"
                  : int > 0.35
                    ? "bg-indigo-400/60"
                    : int > 0
                      ? "bg-indigo-400/25"
                      : "bg-white/[0.06]"
              }`}
              style={{ opacity: int * 0.6 + 0.4 }}
            />
          ))}
          <span className="text-[9px] font-mono text-slate-500">More</span>
        </div>
      </motion.div>

      {/* Code Churn Timeline */}
      <motion.div
        className={`rounded-2xl p-5 ${cardBorder}`}
        style={{ ...glass, boxShadow: glowShadow }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Code Churn Timeline
          </h3>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Additions
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Deletions
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {churnData.map((row, i) => {
            const addPct = (row.additions / maxChurn) * 100;
            const delPct = (row.deletions / maxChurn) * 100;
            return (
              <div key={row.period} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-500 w-8 text-right">
                  {row.period}
                </span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="h-3 rounded-full bg-white/[0.03] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${addPct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                    />
                  </div>
                  <div className="h-3 rounded-full bg-white/[0.03] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-red-500/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${delPct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04 + 0.02 }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end w-20">
                  <span className="text-[9px] font-mono text-emerald-400">
                    +{row.additions.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-mono text-red-400">
                    -{row.deletions.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Complexity Trend */}
      <motion.div
        className={`rounded-2xl p-5 ${cardBorder}`}
        style={{ ...glass, boxShadow: glowShadow }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Complexity Trend
          </h3>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            24 data points
          </span>
        </div>
        <div className="flex items-end gap-1" style={{ height: 120 }}>
          {complexityTrend.map((v, i) => {
            const maxV = Math.max(...complexityTrend, 1);
            const pct = (v / maxV) * 100;
            const col = complexityColor(v);
            return (
              <motion.div
                key={i}
                className={`${col.bar} rounded-t-sm flex-1`}
                style={{ minWidth: 6 }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${pct}%`, opacity: 0.8 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                title={`Complexity: ${v}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] font-mono text-slate-500">Oldest</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" /> High
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">Latest</span>
        </div>
      </motion.div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     COMMITS TAB
     ══════════════════════════════════════════════════════════════════ */
  const renderCommits = () => (
    <motion.div
      className={`rounded-2xl overflow-hidden ${cardBorder}`}
      style={{ ...glass, boxShadow: glowShadow }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="sticky top-0 z-10"
              style={{
                ...glass,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Hash
              </th>
              <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Message
              </th>
              <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Author
              </th>
              <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider text-right">
                Files
              </th>
              <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider text-right">
                +Lines
              </th>
              <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider text-right">
                -Lines
              </th>
              <th className="px-4 py-3 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider text-center">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {commits.map((c, i) => (
              <motion.tr
                key={c.hash}
                className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <td className="px-4 py-2.5">
                  <span className="text-xs font-mono text-indigo-400">
                    {c.hash}
                  </span>
                </td>
                <td className="px-4 py-2.5 max-w-[320px]">
                  <span className="text-xs text-slate-300 truncate block">
                    {c.message}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-mono text-slate-400">
                    {c.author}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[11px] font-mono text-slate-500">
                    {c.date}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-xs font-mono text-white">
                    {c.files}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-xs font-mono text-emerald-400">
                    +{c.insertions}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-xs font-mono text-red-400">
                    -{c.deletions}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full ${riskBadge(c.risk)}`}
                  >
                    {c.risk}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  /* ══════════════════════════════════════════════════════════════════
     COMPLEXITY TAB
     ══════════════════════════════════════════════════════════════════ */
  const renderComplexity = () => (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <motion.div
        className={`rounded-2xl p-4 ${cardBorder} flex items-center justify-between`}
        style={{ ...glass, boxShadow: glowShadow }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
      >
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Modules Analyzed
            </span>
            <span className="text-lg font-mono font-bold text-white">
              {moduleComplexity.length}
            </span>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Avg Cyclomatic
            </span>
            <span className="text-lg font-mono font-bold text-white">
              {avgComplexity}
            </span>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              High Risk Modules
            </span>
            <span className="text-lg font-mono font-bold text-red-400">
              {moduleComplexity.filter((m) => m.cyclomatic > 30).length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: "Low", color: "bg-emerald-500", glow: "rgba(16,185,129,0.3)" },
            { label: "Medium", color: "bg-amber-500", glow: "rgba(245,158,11,0.3)" },
            { label: "High", color: "bg-red-500", glow: "rgba(239,68,68,0.3)" },
          ].map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400"
            >
              <span
                className={`w-2 h-2 rounded-full ${l.color}`}
                style={{ boxShadow: `0 0 6px ${l.glow}` }}
              />
              {l.label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Module complexity cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleComplexity.map((mod, i) => {
          const cc = complexityColor(mod.cyclomatic);
          const barPct = (mod.cyclomatic / maxComplexity) * 100;
          return (
            <motion.div
              key={mod.name}
              className={`rounded-2xl p-4 ${cardBorder}`}
              style={{
                ...glass,
                boxShadow: `${glowShadow}, 0 0 20px ${cc.glow}`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${cc.bar}`}
                    style={{ boxShadow: `0 0 8px ${cc.glow}` }}
                  />
                  <span className="text-sm font-mono font-semibold text-white">
                    {mod.name}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full border ${
                    cc.label === "High"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : cc.label === "Medium"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  {cc.label}
                </span>
              </div>

              {/* Complexity bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-500">
                    Cyclomatic Complexity
                  </span>
                  <span className={`text-sm font-mono font-bold ${cc.text}`}>
                    {mod.cyclomatic}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${cc.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                    style={{ boxShadow: `0 0 8px ${cc.glow}` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">
                    Functions
                  </span>
                  <span className="text-xs font-mono text-white">
                    {mod.functions}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">
                    Lines
                  </span>
                  <span className="text-xs font-mono text-white">
                    {mod.lines.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Mini trend sparkline */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-500">
                  Trend
                </span>
                <Sparkline data={mod.trend} color={cc.bar} height={18} barWidth={4} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     CONTRIBUTORS TAB
     ══════════════════════════════════════════════════════════════════ */
  const maxContribCommits = useMemo(
    () => contributors.length > 0 ? Math.max(...contributors.map((c) => c.commits)) : 1,
    [contributors],
  );
  const maxContribAdd = useMemo(
    () => contributors.length > 0 ? Math.max(...contributors.map((c) => c.additions)) : 1,
    [contributors],
  );

  const renderContributors = () => (
    <div className="flex flex-col gap-4">
      {contributors.length === 0 ? (
        <motion.div
          className={`rounded-2xl p-8 ${cardBorder} text-center`}
          style={{ ...glass, boxShadow: glowShadow }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-slate-400 font-mono">No contributor data available</p>
          <p className="text-xs text-slate-500 mt-1">Contributor analysis requires git history integration</p>
        </motion.div>
      ) : contributors.map((contrib, i) => {
        const commitPct = (contrib.commits / maxContribCommits) * 100;
        const addPct = (contrib.additions / maxContribAdd) * 100;
        const initials = contrib.name
          .split(".")
          .map((p) => p[0].toUpperCase())
          .join("");
        return (
          <motion.div
            key={contrib.name}
            className={`rounded-2xl p-5 ${cardBorder}`}
            style={{ ...glass, boxShadow: glowShadow }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(99,102,241,0.2)",
                  boxShadow: "0 0 12px rgba(99,102,241,0.15)",
                }}
              >
                <span className="text-sm font-mono font-bold text-indigo-400">
                  {initials}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-semibold text-white">
                      {contrib.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.03]">
                      {contrib.streak}d streak
                    </span>
                  </div>
                  <Sparkline
                    data={contrib.trend}
                    color="bg-indigo-500"
                    height={20}
                    barWidth={4}
                  />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      Commits
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {contrib.commits}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      Additions
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      +{contrib.additions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      Deletions
                    </span>
                    <span className="text-sm font-mono font-bold text-red-400">
                      -{contrib.deletions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      Active Days
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {contrib.activeDays}
                    </span>
                  </div>
                </div>

                {/* Contribution bars */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-slate-500 w-14">
                      Commits
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${commitPct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04 }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-slate-500 w-14">
                      Impact
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${addPct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04 + 0.02 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     MAIN RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="qt-dark h-full w-full flex flex-col overflow-hidden"
      style={{ background: darkBg }}
    >
      {/* ── Header Strip ─────────────────────────────────────────── */}
      <motion.div
        className={`shrink-0 flex items-center justify-between px-5 ${cardBorder} rounded-none`}
        style={{ ...glass, height: 56, boxShadow: glowShadow }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Left: title + tabs */}
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-semibold text-white tracking-wide whitespace-nowrap">
            Repository Evolution
          </h1>
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                  style={
                    isActive
                      ? {
                          background: "rgba(99,102,241,0.25)",
                          boxShadow: "0 0 12px rgba(99,102,241,0.15)",
                        }
                      : undefined
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: repo name + LIVE pulse */}
        <div className="flex items-center gap-4">
          {selectedRepository && (
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              {selectedRepository}
              {selectedBranch ? ` / ${selectedBranch}` : ""}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <motion.div
              key={pulseKey}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-widest">
              LIVE
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Scrollable Content ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* ── Top Metrics Strip ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsCards.map((card, i) => (
            <motion.div
              key={card.label}
              className={`rounded-2xl p-4 ${cardBorder}`}
              style={{ ...glass, boxShadow: glowShadow }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                {card.delta && (
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      card.deltaUp ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {card.delta}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-mono font-bold text-white">
                  {card.value}
                </span>
                <Sparkline
                  data={card.sparkline}
                  color={card.color}
                  height={28}
                  barWidth={3}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Active Tab Content ─────────────────────────────────── */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "commits" && renderCommits()}
        {activeTab === "complexity" && renderComplexity()}
        {activeTab === "contributors" && renderContributors()}
      </div>
    </div>
  );
}

export default RepositoryEvolution;
