import { useState, useMemo } from "react";

function SecurityScanner() {
  const [selectedVulnId, setSelectedVulnId] = useState(null);

  // Mock vulnerability data
  const vulnerabilities = [
    {
      id: 1,
      cve: "CVE-2024-1234",
      severity: "critical",
      exploitability: 9.8,
      affectedVersions: "1.0.0 - 1.5.2",
      library: "auth-core",
      patchVersion: "1.5.3",
      description:
        "Remote code execution via deserialization vulnerability in JWT parsing",
      affectedModules: 5,
      dependencyChain: "auth-core → api-gateway → core-router",
    },
    {
      id: 2,
      cve: "CVE-2024-5678",
      severity: "high",
      exploitability: 7.2,
      affectedVersions: "2.1.0 - 2.3.1",
      library: "crypto-lib",
      patchVersion: "2.3.2",
      description: "Timing attack vulnerability in HMAC comparison function",
      affectedModules: 3,
      dependencyChain: "crypto-lib → payment-gateway → security-layer",
    },
    {
      id: 3,
      cve: "CVE-2024-9101",
      severity: "high",
      exploitability: 6.5,
      affectedVersions: "3.0.0 - 3.2.4",
      library: "http-client",
      patchVersion: "3.2.5",
      description: "Prototype pollution in query parameter parsing",
      affectedModules: 7,
      dependencyChain: "http-client → event-stream → core-api",
    },
    {
      id: 4,
      cve: "CVE-2024-1112",
      severity: "medium",
      exploitability: 5.1,
      affectedVersions: "1.4.0 - 1.6.2",
      library: "xml-parser",
      patchVersion: "1.6.3",
      description:
        "XML External Entity (XXE) injection in configuration parsing",
      affectedModules: 2,
      dependencyChain: "xml-parser → config-manager → bootstrap",
    },
    {
      id: 5,
      cve: "CVE-2024-1314",
      severity: "medium",
      exploitability: 4.3,
      affectedVersions: "2.0.0 - 2.1.5",
      library: "logging-lib",
      patchVersion: "2.1.6",
      description: "Information disclosure in error stack traces",
      affectedModules: 4,
      dependencyChain: "logging-lib → middleware → api-handlers",
    },
  ];

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
  const patchCoverage = Math.round((patchedCount / totalVulnerabilities) * 100);
  const avgExploitability = (
    vulnerabilities.reduce((sum, v) => sum + v.exploitability, 0) /
    totalVulnerabilities
  ).toFixed(1);

  // Transitive vulnerability depth (max dependency chain depth)
  const maxTransitiveDepth = vulnerabilities.reduce((max, v) => {
    const depth = v.dependencyChain.split(" → ").length;
    return Math.max(max, depth);
  }, 0);

  // Severity distribution
  const criticalPct = Math.round((criticalVulns / totalVulnerabilities) * 100);
  const highPct = Math.round((highVulns / totalVulnerabilities) * 100);
  const mediumPct = Math.round((mediumVulns / totalVulnerabilities) * 100);

  // Attack surface modules (unique affected modules)
  const affectedModulesSet = new Set();
  vulnerabilities.forEach((v) => {
    v.dependencyChain
      .split(" → ")
      .forEach((m) => affectedModulesSet.add(m.trim()));
  });
  const attackSurfaceSize = affectedModulesSet.size;

  const getRiskColor = (severity) => {
    if (severity === "critical") return "text-red-600";
    if (severity === "high") return "text-orange-600";
    if (severity === "medium") return "text-amber-600";
    return "text-slate-900";
  };

  const getRiskBgColor = (severity) => {
    if (severity === "critical") return "bg-red-100";
    if (severity === "high") return "bg-orange-100";
    if (severity === "medium") return "bg-amber-100";
    return "bg-slate-100";
  };

  return (
    <div className="h-full w-full bg-[#f8fafc] flex overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
          <h1 className="text-sm font-semibold text-slate-900">
            Security Scanner
          </h1>
        </header>

        {/* Threat Exposure Intelligence Strip */}
        <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-3">
          <div className="flex gap-10 mb-4">
            {/* Zone A — Security Posture */}
            <div className="flex-1 border-r border-slate-200 pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    SECURITY SCORE
                  </p>
                  <p
                    className={`text-xl font-mono font-bold leading-none ${securityScore > 60 ? "text-emerald-600" : securityScore > 30 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {Math.round(securityScore)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    CRITICAL VULNS
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${criticalVulns > 0 ? "text-red-600" : "text-slate-900"}`}
                  >
                    {criticalVulns}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    TOTAL
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {totalVulnerabilities}
                  </p>
                </div>
              </div>
            </div>

            {/* Zone B — Coverage & Exposure */}
            <div className="flex-1 border-r border-slate-200 pr-10">
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    PATCH COVERAGE
                  </p>
                  <p className="text-xl font-mono font-bold leading-none text-slate-900">
                    {patchCoverage}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    AVG EXPLOITABILITY
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {avgExploitability}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    ATTACK SURFACE
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {attackSurfaceSize} modules
                  </p>
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
                  <p className="text-xl font-mono font-bold leading-none text-slate-900">
                    {maxTransitiveDepth}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    HIGH VULNS
                  </p>
                  <p
                    className={`text-sm font-mono font-bold ${highVulns > 0 ? "text-orange-600" : "text-slate-900"}`}
                  >
                    {highVulns}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0 font-mono">
                    PATCHED
                  </p>
                  <p className="text-sm font-mono font-bold text-emerald-600">
                    {patchedCount}/{totalVulnerabilities}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CVE Severity Distribution Bar */}
          <div className="border-t border-slate-200 pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              CVE SEVERITY
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 border border-slate-300 overflow-hidden rounded-sm flex">
                {criticalVulns > 0 && (
                  <div
                    className="bg-red-600 transition-all duration-150"
                    style={{ width: `${criticalPct}%` }}
                  />
                )}
                {highVulns > 0 && (
                  <div
                    className="bg-orange-500 transition-all duration-150"
                    style={{ width: `${highPct}%` }}
                  />
                )}
                {mediumVulns > 0 && (
                  <div
                    className="bg-amber-500 transition-all duration-150"
                    style={{ width: `${mediumPct}%` }}
                  />
                )}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-600 font-mono">
                <span>
                  <span className="text-red-600 font-bold">
                    {criticalVulns}
                  </span>
                  C
                </span>
                <span>
                  <span className="text-orange-600 font-bold">{highVulns}</span>
                  H
                </span>
                <span>
                  <span className="text-amber-600 font-bold">
                    {mediumVulns}
                  </span>
                  M
                </span>
              </div>
            </div>
          </div>

          {/* Patch Coverage Bar */}
          <div className="border-t border-slate-200 pt-2 mb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              PATCH STATUS
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 border border-slate-300 overflow-hidden rounded-sm flex">
                <div
                  className="bg-emerald-600 transition-all duration-150"
                  style={{ width: `${patchCoverage}%` }}
                />
                <div
                  className="bg-slate-300 transition-all duration-150"
                  style={{ width: `${100 - patchCoverage}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-900">
                {patchCoverage}%
              </span>
            </div>
          </div>

          {/* Attack Surface Segmentation (Simple Module Count Histogram) */}
          <div className="border-t border-slate-200 pt-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
              AFFECTED MODULES
            </p>
            <div className="flex items-end gap-1 h-8">
              {Array.from({ length: Math.ceil(attackSurfaceSize / 2) }).map(
                (_, idx) => {
                  const moduleCount = (idx + 1) * 2;
                  const isActive = moduleCount <= attackSurfaceSize;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 border transition-all duration-150 ${
                        isActive
                          ? "bg-red-500 border-red-600"
                          : "bg-slate-200 border-slate-300"
                      }`}
                      style={{ height: isActive ? "100%" : "20%" }}
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
            <thead className="bg-white sticky top-0">
              <tr className="border-b border-slate-200">
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  CVE
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Severity
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Library
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Exploitability
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Affected Modules
                </th>
                <th className="text-left px-6 py-3 font-medium text-slate-900">
                  Patch
                </th>
              </tr>
            </thead>
            <tbody>
              {vulnerabilities.map((vuln) => (
                <tr
                  key={vuln.id}
                  onClick={() => setSelectedVulnId(vuln.id)}
                  className={`cursor-pointer border-b border-slate-200 transition-colors duration-150 ${
                    selectedVulnId === vuln.id
                      ? "bg-slate-100 border-l-2 border-l-blue-500"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <td className="px-6 py-3 font-mono text-slate-900">
                    {vuln.cve}
                  </td>
                  <td
                    className={`px-6 py-3 font-mono font-semibold ${getRiskColor(vuln.severity)}`}
                  >
                    {vuln.severity}
                  </td>
                  <td className="px-6 py-3 text-slate-900">{vuln.library}</td>
                  <td className="px-6 py-3 font-mono text-slate-900">
                    {vuln.exploitability.toFixed(1)}
                  </td>
                  <td className="px-6 py-3 text-slate-900">
                    {vuln.affectedModules}
                  </td>
                  <td className="px-6 py-3 text-emerald-600 font-mono">
                    {vuln.patchVersion ? "✓" : "—"}
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
            selectedVuln ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="h-14 border-b border-slate-200 flex items-center px-5 shrink-0">
            <h2 className="text-sm font-medium text-slate-900">
              Threat Intelligence
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Vulnerability Distribution
                </p>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Critical</span>
                    <span className="font-mono text-red-600">
                      {criticalVulns}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High</span>
                    <span className="font-mono text-orange-600">
                      {highVulns}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium</span>
                    <span className="font-mono text-amber-600">
                      {mediumVulns}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Top Attack Vectors
                </p>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="font-mono">RCE (Remote Code Execution)</div>
                  <div className="font-mono">Timing Attacks</div>
                  <div className="font-mono">Prototype Pollution</div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Exposure Metrics
                </p>
                <div className="space-y-1 text-xs text-slate-600">
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
                    <span className="font-mono text-emerald-600">
                      {patchCoverage}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Remediation Priority
                </p>
                <div className="text-xs text-slate-600 leading-relaxed">
                  Address critical vulnerabilities immediately. High-priority
                  patches available for all exploitable CVEs.
                </div>
              </div>
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
              <div className="h-14 border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
                <h2 className="text-sm font-medium text-slate-900">
                  CVE Details
                </h2>
                <button
                  onClick={() => setSelectedVulnId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">CVE ID</p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {selectedVuln.cve}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Severity</p>
                    <p
                      className={`text-sm font-mono font-bold ${getRiskColor(selectedVuln.severity)}`}
                    >
                      {selectedVuln.severity.toUpperCase()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Exploitability Score
                    </p>
                    <p className="text-lg font-mono font-bold text-slate-900">
                      {selectedVuln.exploitability}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Description
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-4">
                      {selectedVuln.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Affected Versions
                    </p>
                    <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-sm">
                      {selectedVuln.affectedVersions}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Dependency Chain
                    </p>
                    <p className="text-xs font-mono text-slate-600 leading-relaxed">
                      {selectedVuln.dependencyChain}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Patch Available
                    </p>
                    <p className="text-xs font-mono text-emerald-600 font-medium">
                      {selectedVuln.patchVersion}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Affected Modules
                    </p>
                    <p className="text-xs font-mono text-slate-600">
                      {selectedVuln.affectedModules} downstream modules
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

export default SecurityScanner;
