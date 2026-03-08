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

function SecurityScanner() {
  const [selectedVulnId, setSelectedVulnId] = useState(null);

  // Fetch vulnerabilities from API via Zustand store
  const vulnerabilities = useIntelligenceStore((state) => state.vulnerabilities);
  const fetchVulnerabilitiesData = useIntelligenceStore((state) => state.fetchVulnerabilitiesData);
  const initialized = useIntelligenceStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      useIntelligenceStore.getState().fetchAll();
    } else if (vulnerabilities.length === 0) {
      fetchVulnerabilitiesData();
    }
  }, [initialized, vulnerabilities.length, fetchVulnerabilitiesData]);

  const selectedVuln = vulnerabilities.find((v) => v.id === selectedVulnId);

  // ==================== SECURITY METRICS ====================
  const totalVulnerabilities = vulnerabilities.length;
  const criticalVulns = vulnerabilities.filter(
    (v) => v.severity === "critical",
  ).length;
  const highVulns = vulnerabilities.filter((v) => v.severity === "high").length;
  const mediumVulns = vulnerabilities.filter(
    (v) => v.severity === "medium",
  ).length;

  // Security Score: 100 - NormalizedWeightedRisk
  const calculateSecurityScore = () => {
    const criticalWeight = criticalVulns * 30;
    const highWeight = highVulns * 15;
    const mediumWeight = mediumVulns * 8;
    const totalWeight = criticalWeight + highWeight + mediumWeight;
    const maxWeight = 100;
    const normalizedRisk = Math.min((totalWeight / maxWeight) * 100, 100);
    return Math.max(0, 100 - normalizedRisk);
  };

  const securityScore = calculateSecurityScore();
  const patchedCount = vulnerabilities.filter((v) => v.patchVersion).length;
  const patchCoverage = totalVulnerabilities > 0 ? Math.round((patchedCount / totalVulnerabilities) * 100) : 0;
  const avgExploitability = totalVulnerabilities > 0
    ? (vulnerabilities.reduce((sum, v) => sum + (v.exploitability || 0), 0) / totalVulnerabilities).toFixed(1)
    : "0.0";

  // Transitive vulnerability depth (max dependency chain depth)
  const maxTransitiveDepth = vulnerabilities.reduce((max, v) => {
    const chain = v.dependencyChain || "";
    const depth = chain ? chain.split(" → ").length : 0;
    return Math.max(max, depth);
  }, 0);

  // Severity distribution
  const criticalPct = totalVulnerabilities > 0 ? Math.round((criticalVulns / totalVulnerabilities) * 100) : 0;
  const highPct = totalVulnerabilities > 0 ? Math.round((highVulns / totalVulnerabilities) * 100) : 0;
  const mediumPct = totalVulnerabilities > 0 ? Math.round((mediumVulns / totalVulnerabilities) * 100) : 0;

  // Attack surface modules (unique affected modules)
  const affectedModulesSet = new Set();
  vulnerabilities.forEach((v) => {
    const chain = v.dependencyChain || "";
    if (chain) {
      chain.split(" → ").forEach((m) => affectedModulesSet.add(m.trim()));
    }
  });
  const attackSurfaceSize = affectedModulesSet.size;

  // Top attack vectors derived from vulnerability descriptions/libraries
  const topAttackVectors = useMemo(() => {
    if (vulnerabilities.length === 0) return [];
    const vectors = new Map();
    vulnerabilities.forEach((v) => {
      const key = v.library || v.cve || "Unknown";
      const existing = vectors.get(key);
      if (!existing || v.exploitability > existing.exploitability) {
        vectors.set(key, { name: key, severity: v.severity, exploitability: v.exploitability || 0 });
      }
    });
    return [...vectors.values()]
      .sort((a, b) => b.exploitability - a.exploitability)
      .slice(0, 3);
  }, [vulnerabilities]);

  // Dynamic remediation summary
  const remediationSummary = useMemo(() => {
    if (totalVulnerabilities === 0) return "No vulnerabilities detected.";
    const parts = [];
    if (criticalVulns > 0) parts.push(`${criticalVulns} critical`);
    if (highVulns > 0) parts.push(`${highVulns} high`);
    if (mediumVulns > 0) parts.push(`${mediumVulns} medium`);
    return `${parts.join(", ")} vulnerabilit${totalVulnerabilities === 1 ? "y" : "ies"} found. ${patchedCount} of ${totalVulnerabilities} ${patchedCount === 1 ? "has" : "have"} patches available.`;
  }, [totalVulnerabilities, criticalVulns, highVulns, mediumVulns, patchedCount]);

  const getRiskColor = (severity) => {
    if (severity === "critical") return "text-red-400";
    if (severity === "high") return "text-orange-400";
    if (severity === "medium") return "text-amber-400";
    return "text-white";
  };

  const getRiskBgColor = (severity) => {
    if (severity === "critical") return "bg-red-500/20";
    if (severity === "high") return "bg-orange-500/20";
    if (severity === "medium") return "bg-amber-500/20";
    return "bg-white/[0.06]";
  };

  return (
    <div className="h-full w-full flex overflow-hidden" style={{ background: darkBg }}>
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-white/[0.06] flex items-center px-6 shrink-0" style={{ ...glass, boxShadow: glowShadow }}>
          <h1 className="text-sm font-semibold text-white">
            Security Scanner
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            <motion.div className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ boxShadow: "0 0 8px rgba(52,211,153,0.4)" }} />
            <span className="text-[10px] font-mono text-emerald-400/70">LIVE</span>
          </div>
        </header>

        {/* Threat Exposure Intelligence Strip */}
        <div className="border-b border-white/[0.06] shrink-0 px-6 py-3" style={{ ...glass, boxShadow: glowShadow }}>
          <div className="flex gap-10 mb-4">
            {/* Zone A — Security Posture */}
            <div className="flex-1 border-r border-white/[0.06] pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    SECURITY SCORE
                  </p>
                  <motion.p
                    className={`text-xl font-mono font-bold leading-none ${securityScore > 60 ? "text-emerald-400" : securityScore > 30 ? "text-amber-400" : "text-red-400"}`}
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0 * 0.05, duration: 0.4 }}
                    style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}
                  >
                    {Math.round(securityScore)}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    CRITICAL VULNS
                  </p>
                  <motion.p
                    className={`text-sm font-mono font-bold ${criticalVulns > 0 ? "text-red-400" : "text-white"}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 * 0.05 }}
                  >
                    {criticalVulns}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    TOTAL
                  </p>
                  <motion.p
                    className="text-sm font-mono font-bold text-white"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 * 0.05 }}
                  >
                    {totalVulnerabilities}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Zone B — Coverage & Exposure */}
            <div className="flex-1 border-r border-white/[0.06] pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    PATCH COVERAGE
                  </p>
                  <motion.p
                    className="text-xl font-mono font-bold leading-none text-white"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3 * 0.05 }}
                  >
                    {patchCoverage}%
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    AVG EXPLOITABILITY
                  </p>
                  <motion.p
                    className="text-sm font-mono font-bold text-white"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 4 * 0.05 }}
                  >
                    {avgExploitability}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    ATTACK SURFACE
                  </p>
                  <motion.p
                    className="text-sm font-mono font-bold text-white"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5 * 0.05 }}
                  >
                    {attackSurfaceSize} modules
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Zone C — Transitive Depth */}
            <div className="flex-1">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    TRANSITIVE DEPTH
                  </p>
                  <motion.p
                    className="text-xl font-mono font-bold leading-none text-white"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 6 * 0.05 }}
                  >
                    {maxTransitiveDepth}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    HIGH VULNS
                  </p>
                  <motion.p
                    className={`text-sm font-mono font-bold ${highVulns > 0 ? "text-orange-400" : "text-white"}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 7 * 0.05 }}
                  >
                    {highVulns}
                  </motion.p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    PATCHED
                  </p>
                  <motion.p
                    className="text-sm font-mono font-bold text-emerald-400"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 8 * 0.05 }}
                  >
                    {patchedCount}/{totalVulnerabilities}
                  </motion.p>
                </div>
              </div>
            </div>
          </div>

          {/* CVE Severity Distribution Bar */}
          <div className="border-t border-white/[0.06] pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              CVE SEVERITY
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/[0.06] border border-white/[0.08] overflow-hidden rounded-sm flex">
                {criticalVulns > 0 && (
                  <motion.div
                    className="bg-red-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${criticalPct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                )}
                {highVulns > 0 && (
                  <motion.div
                    className="bg-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${highPct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                )}
                {mediumVulns > 0 && (
                  <motion.div
                    className="bg-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${mediumPct}%` }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  />
                )}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                <span>
                  <span className="text-red-400 font-bold">
                    {criticalVulns}
                  </span>
                  C
                </span>
                <span>
                  <span className="text-orange-400 font-bold">{highVulns}</span>
                  H
                </span>
                <span>
                  <span className="text-amber-400 font-bold">
                    {mediumVulns}
                  </span>
                  M
                </span>
              </div>
            </div>
          </div>

          {/* Patch Coverage Bar */}
          <div className="border-t border-white/[0.06] pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              PATCH STATUS
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/[0.06] border border-white/[0.08] overflow-hidden rounded-sm flex">
                <motion.div
                  className="bg-emerald-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${patchCoverage}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
                <motion.div
                  className="bg-white/[0.08]"
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - patchCoverage}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              </div>
              <span className="text-[10px] font-mono text-white">
                {patchCoverage}%
              </span>
            </div>
          </div>

          {/* Attack Surface Segmentation (Simple Module Count Histogram) */}
          <div className="border-t border-white/[0.06] pt-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              AFFECTED MODULES
            </p>
            <div className="flex items-end gap-1 h-8">
              {Array.from({ length: Math.ceil(attackSurfaceSize / 2) }).map(
                (_, idx) => {
                  const moduleCount = (idx + 1) * 2;
                  const isActive = moduleCount <= attackSurfaceSize;
                  return (
                    <motion.div
                      key={idx}
                      className={`flex-1 border ${
                        isActive
                          ? "bg-red-500/80 border-red-500"
                          : "bg-white/[0.06] border-white/[0.08]"
                      }`}
                      initial={{ height: "0%" }}
                      animate={{ height: isActive ? "100%" : "20%" }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                    />
                  );
                },
              )}
            </div>
          </div>
        </div>

        {/* Vulnerability Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0" style={{ ...glass, boxShadow: glowShadow }}>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  CVE
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Severity
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Library
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Exploitability
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Affected Modules
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-400">
                  Patch
                </th>
              </tr>
            </thead>
            <tbody>
              {vulnerabilities.map((vuln, index) => (
                <motion.tr
                  key={vuln.id}
                  onClick={() => setSelectedVulnId(vuln.id)}
                  className={`cursor-pointer border-b border-white/[0.06] transition-colors duration-150 ${
                    selectedVulnId === vuln.id
                      ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                      : "hover:bg-white/[0.03]"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <td className="px-6 py-3 font-mono text-slate-300">
                    {vuln.cve}
                  </td>
                  <td
                    className={`px-6 py-3 font-mono font-semibold ${getRiskColor(vuln.severity)}`}
                  >
                    {vuln.severity}
                  </td>
                  <td className="px-6 py-3 text-slate-300">{vuln.library}</td>
                  <td className="px-6 py-3 font-mono text-slate-300">
                    {vuln.exploitability.toFixed(1)}
                  </td>
                  <td className="px-6 py-3 text-slate-300">
                    {vuln.affectedModules}
                  </td>
                  <td className="px-6 py-3 text-emerald-400 font-mono">
                    {vuln.patchVersion ? "✓" : "—"}
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
            selectedVuln ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="h-14 border-b border-white/[0.06] flex items-center px-5 shrink-0">
            <h2 className="text-sm font-medium text-white">
              Threat Intelligence
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 * 0.06 }}
              >
                <p className="text-sm font-medium text-white mb-2" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Vulnerability Distribution
                </p>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Critical</span>
                    <span className="font-mono text-red-400">
                      {criticalVulns}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High</span>
                    <span className="font-mono text-orange-400">
                      {highVulns}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium</span>
                    <span className="font-mono text-amber-400">
                      {mediumVulns}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 * 0.06 }}
              >
                <p className="text-sm font-medium text-white mb-2" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Top Attack Vectors
                </p>
                <div className="space-y-1 text-xs text-slate-400">
                  {topAttackVectors.length > 0 ? topAttackVectors.map((v) => (
                    <div key={v.name} className="font-mono">{v.name}</div>
                  )) : (
                    <div className="font-mono text-slate-500">No vectors detected</div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 * 0.06 }}
              >
                <p className="text-sm font-medium text-white mb-2" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Exposure Metrics
                </p>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Affected Modules</span>
                    <span className="font-mono">{attackSurfaceSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Chain Depth</span>
                    <span className="font-mono">{maxTransitiveDepth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patch Coverage</span>
                    <span className="font-mono text-emerald-400">
                      {patchCoverage}%
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 * 0.06 }}
              >
                <p className="text-sm font-medium text-white mb-2" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Remediation Priority
                </p>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {remediationSummary}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${
            selectedVuln ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {selectedVuln ? (
            <>
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 shrink-0">
                <h2 className="text-sm font-medium text-white">
                  CVE Details
                </h2>
                <button
                  onClick={() => setSelectedVulnId(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 * 0.06 }}
                  >
                    <p className="text-xs text-slate-500 mb-1">CVE ID</p>
                    <p className="text-sm font-mono font-bold text-white">
                      {selectedVuln.cve}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 * 0.06 }}
                  >
                    <p className="text-xs text-slate-500 mb-1">Severity</p>
                    <p
                      className={`text-sm font-mono font-bold ${getRiskColor(selectedVuln.severity)}`}
                    >
                      {selectedVuln.severity.toUpperCase()}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 * 0.06 }}
                  >
                    <p className="text-xs text-slate-500 mb-1">
                      Exploitability Score
                    </p>
                    <p className="text-lg font-mono font-bold text-white">
                      {selectedVuln.exploitability}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-1" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                      Description
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                      {selectedVuln.description}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 4 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-2" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                      Affected Versions
                    </p>
                    <p className="text-xs font-mono text-slate-400 bg-white/[0.04] p-2 rounded-lg">
                      {selectedVuln.affectedVersions}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-2" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                      Dependency Chain
                    </p>
                    <p className="text-xs font-mono text-slate-400 leading-relaxed">
                      {selectedVuln.dependencyChain}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 6 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-1" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                      Patch Available
                    </p>
                    <p className="text-xs font-mono text-emerald-400 font-medium">
                      {selectedVuln.patchVersion}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 7 * 0.06 }}
                  >
                    <p className="text-sm font-medium text-white mb-1" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                      Affected Modules
                    </p>
                    <p className="text-xs font-mono text-slate-400">
                      {selectedVuln.affectedModules} downstream modules
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

export default SecurityScanner;
