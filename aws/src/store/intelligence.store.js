import { create } from "zustand";

// PHASE 8: Global Intelligence Engine State
// Centralized data layer for all pages with memoized selectors

const useIntelligenceStore = create((set, get) => ({
  // ==================== MODULE DATA ====================
  modules: [
    {
      id: 1,
      name: "Core API",
      riskScore: 82,
      riskLevel: "high",
      bugCount: 12,
      dependencyCount: 8,
      impactRadius: 4,
      lastModified: "Feb 28",
      bugs: [{ id: 1, severity: "critical", title: "RCE via deserialization" }],
      aiSummary:
        "Primary gateway for request routing. High criticality, frequent updates required.",
    },
    {
      id: 2,
      name: "Event Stream",
      riskScore: 48,
      riskLevel: "medium",
      bugCount: 5,
      dependencyCount: 4,
      impactRadius: 2,
      lastModified: "Feb 26",
      bugs: [{ id: 2, severity: "high", title: "Timing attack in HMAC" }],
      aiSummary:
        "Analytics pipeline connector. Medium volatility due to recent throughput improvements.",
    },
    {
      id: 3,
      name: "UI Shell",
      riskScore: 35,
      riskLevel: "low",
      bugCount: 2,
      dependencyCount: 5,
      impactRadius: 1,
      lastModified: "Feb 25",
      bugs: [],
      aiSummary: "Client interface container. Low risk with stable API.",
    },
    {
      id: 4,
      name: "Vector Store",
      riskScore: 20,
      riskLevel: "low",
      bugCount: 1,
      dependencyCount: 2,
      impactRadius: 1,
      lastModified: "Feb 20",
      bugs: [],
      aiSummary: "Embedding storage. Simple, predictable workload.",
    },
    {
      id: 5,
      name: "Auth Service",
      riskScore: 65,
      riskLevel: "high",
      bugCount: 8,
      dependencyCount: 3,
      impactRadius: 3,
      lastModified: "Feb 27",
      bugs: [{ id: 3, severity: "critical", title: "Token validation bypass" }],
      aiSummary:
        "Security boundary. Frequent policy updates increase complexity.",
    },
    {
      id: 6,
      name: "Cache Layer",
      riskScore: 42,
      riskLevel: "medium",
      bugCount: 4,
      dependencyCount: 6,
      impactRadius: 2,
      lastModified: "Feb 23",
      bugs: [],
      aiSummary: "Performance optimization tier. Eviction policy needs review.",
    },
    {
      id: 7,
      name: "Log Aggregator",
      riskScore: 55,
      riskLevel: "medium",
      bugCount: 6,
      dependencyCount: 7,
      impactRadius: 3,
      lastModified: "Feb 22",
      bugs: [
        { id: 4, severity: "high", title: "Information disclosure in errors" },
      ],
      aiSummary:
        "Monitoring foundation. Stack trace exposure requires hardening.",
    },
  ],

  // ==================== VULNERABILITY DATA ====================
  vulnerabilities: [
    {
      id: 1,
      cve: "CVE-2024-1234",
      severity: "critical",
      exploitability: 9.8,
      affectedVersions: "1.0.0 - 1.5.2",
      library: "auth-core",
      patchVersion: "1.5.3",
      description: "RCE in JWT parsing",
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
      description: "Timing attack in HMAC",
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
      description: "Prototype pollution",
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
      description: "XXE injection",
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
      description: "Stack trace disclosure",
      affectedModules: 4,
      dependencyChain: "logging-lib → middleware → api-handlers",
    },
  ],

  // ==================== DEPENDENCY DATA ====================
  dependencies: [
    {
      id: 1,
      module: "auth-core",
      incomingCount: 8,
      outgoingCount: 3,
      gravity: 24,
      depth: 0,
      circularDeps: 0,
      implicitDeps: 2,
      fans: { in: 8, out: 3 },
      volatility: 0.35,
      chain: "[root] → auth-core",
    },
    {
      id: 2,
      module: "api-gateway",
      incomingCount: 12,
      outgoingCount: 5,
      gravity: 60,
      depth: 1,
      circularDeps: 1,
      implicitDeps: 4,
      fans: { in: 12, out: 5 },
      volatility: 0.58,
      chain: "[root] → api-gateway → auth-core",
    },
    {
      id: 3,
      module: "crypto-lib",
      incomingCount: 5,
      outgoingCount: 2,
      gravity: 10,
      depth: 2,
      circularDeps: 0,
      implicitDeps: 1,
      fans: { in: 5, out: 2 },
      volatility: 0.22,
      chain: "[root] → api-gateway → crypto-lib",
    },
    {
      id: 4,
      module: "event-stream",
      incomingCount: 14,
      outgoingCount: 7,
      gravity: 98,
      depth: 1,
      circularDeps: 2,
      implicitDeps: 5,
      fans: { in: 14, out: 7 },
      volatility: 0.72,
      chain: "[root] → event-stream → api-gateway",
    },
    {
      id: 5,
      module: "http-client",
      incomingCount: 9,
      outgoingCount: 4,
      gravity: 36,
      depth: 2,
      circularDeps: 1,
      implicitDeps: 3,
      fans: { in: 9, out: 4 },
      volatility: 0.45,
      chain: "[root] → api-gateway → http-client",
    },
    {
      id: 6,
      module: "logging-lib",
      incomingCount: 11,
      outgoingCount: 1,
      gravity: 11,
      depth: 3,
      circularDeps: 0,
      implicitDeps: 0,
      fans: { in: 11, out: 1 },
      volatility: 0.18,
      chain: "[root] → api-gateway → http-client → logging-lib",
    },
  ],

  // ==================== EVOLUTION DATA ====================
  timePeriods: [
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
    },
  ],

  // ==================== UI STATE ====================
  selectedRepository: "Quantum-Core",
  selectedBranch: "main",
  selectedVersion: "Current",

  // ==================== MEMOIZED SELECTORS ====================

  // Bug & Risk selectors
  getModuleById: (moduleId) => {
    const { modules } = get();
    return modules.find((m) => m.id === moduleId);
  },

  calculateEntropy: () => {
    const { modules } = get();
    const bugCounts = modules.map((m) => m.bugCount);
    const total = bugCounts.reduce((sum, count) => sum + count, 0);
    const probabilities = bugCounts.map(
      (count) => (count + 1) / (total + bugCounts.length),
    );
    const entropy = -probabilities.reduce(
      (sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0),
      0,
    );
    const maxEntropy = Math.log2(bugCounts.length);
    const normalized = (entropy / maxEntropy) * 100;
    return {
      raw: entropy.toFixed(3),
      normalized: Math.round(normalized),
      maxEntropy: maxEntropy.toFixed(3),
      interpretation:
        normalized > 66
          ? "distributed"
          : normalized > 33
            ? "balanced"
            : "concentrated",
    };
  },

  calculateGravity: (moduleId) => {
    const { modules } = get();
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return 0;
    const baseGravity = module.riskScore;
    const cascadeEffect = module.dependencyCount * 2;
    return baseGravity + cascadeEffect;
  },

  // Security Scanner selectors
  getSecurityScore: () => {
    const { vulnerabilities } = get();
    const criticalCount = vulnerabilities.filter(
      (v) => v.severity === "critical",
    ).length;
    const highCount = vulnerabilities.filter(
      (v) => v.severity === "high",
    ).length;
    const mediumCount = vulnerabilities.filter(
      (v) => v.severity === "medium",
    ).length;
    const criticalWeight = criticalCount * 30;
    const highWeight = highCount * 15;
    const mediumWeight = mediumCount * 8;
    const totalWeight = criticalWeight + highWeight + mediumWeight;
    const maxWeight = 100;
    const normalizedRisk = Math.min((totalWeight / maxWeight) * 100, 100);
    return Math.max(0, 100 - normalizedRisk);
  },

  // Dependency Intelligence selectors
  getHubModules: () => {
    const { dependencies } = get();
    const maxHubScore = Math.max(
      ...dependencies.map((d) => (d.fans.in + d.fans.out) / 2),
    );
    return dependencies.filter(
      (d) => (d.fans.in + d.fans.out) / 2 > maxHubScore * 0.7,
    );
  },

  // Evolution selectors
  getRiskTrend: () => {
    const { timePeriods } = get();
    if (timePeriods.length < 2) return 0;
    return (
      timePeriods[timePeriods.length - 1].riskScore - timePeriods[0].riskScore
    );
  },

  // ==================== ACTIONS ====================
  setSelectedRepository: (repo) => set({ selectedRepository: repo }),
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),
  setSelectedVersion: (version) => set({ selectedVersion: version }),
}));

export default useIntelligenceStore;
