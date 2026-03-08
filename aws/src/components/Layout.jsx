import { useState, useMemo } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

const Icon = ({ name, className = "", style = {} }) => (
  <span className={`material-symbols-outlined ${className}`} style={style}>
    {name}
  </span>
);

// Repository configurations (shared)
const repositoriesConfig = {
  "Quantum-Core": {
    name: "Quantum-Core",
    fullName: "quantum-core-v2",
    metrics: [
      {
        title: "Total Files Analyzed",
        value: "12,842",
        badge: "+4.2%",
        icon: "description",
        iconColor: "text-blue-600",
        iconBg: "bg-blue-50",
        badgeColor: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "High Risk Modules",
        value: "14",
        badge: "High Risk",
        icon: "warning",
        iconColor: "text-orange-500",
        iconBg: "bg-orange-50",
        badgeColor: "bg-orange-50 text-orange-600",
      },
      {
        title: "Security Issues",
        value: "5",
        badge: "Critical",
        icon: "security",
        iconColor: "text-red-500",
        iconBg: "bg-red-50",
        badgeColor: "bg-red-50 text-red-600",
      },
      {
        title: "Performance Bottlenecks",
        value: "28",
        badge: "Stable",
        icon: "speed",
        iconColor: "text-blue-500",
        iconBg: "bg-blue-50",
        badgeColor: "bg-blue-50 text-blue-600",
      },
    ],
  },
  "Payment-Service": {
    name: "Payment-Service",
    fullName: "payment-service-api",
    metrics: [
      {
        title: "Total Files Analyzed",
        value: "8,420",
        badge: "+2.1%",
        icon: "description",
        iconColor: "text-blue-600",
        iconBg: "bg-blue-50",
        badgeColor: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "High Risk Modules",
        value: "22",
        badge: "Critical",
        icon: "warning",
        iconColor: "text-orange-500",
        iconBg: "bg-orange-50",
        badgeColor: "bg-red-50 text-red-600",
      },
      {
        title: "Security Issues",
        value: "8",
        badge: "Urgent",
        icon: "security",
        iconColor: "text-red-500",
        iconBg: "bg-red-50",
        badgeColor: "bg-red-50 text-red-600",
      },
      {
        title: "Performance Bottlenecks",
        value: "42",
        badge: "Degrading",
        icon: "speed",
        iconColor: "text-orange-500",
        iconBg: "bg-orange-50",
        badgeColor: "bg-orange-50 text-orange-600",
      },
    ],
  },
};

const navItems = [
  { label: "Dashboard", icon: "dashboard", path: "/" },
  { label: "Architecture Map", icon: "map", path: "/architecture" },
  { label: "Bug & Risk Analysis", icon: "bug_report", path: "/bug-risk" },
  { label: "Security Scanner", icon: "shield", path: "/security" },
  { label: "Dependency Intelligence", icon: "share", path: "/dependencies" },
  { label: "Repository Evolution", icon: "history", path: "/evolution" },
];

// Helper function to calculate repository confidence score
const calculateConfidenceScore = (riskModules, securityIssues, bottlenecks) => {
  const baseScore = 100;
  const riskPenalty = riskModules * 2;
  const securityPenalty = securityIssues * 3.5;
  const bottleneckPenalty = Math.floor(bottlenecks / 2);
  const score = Math.max(
    0,
    baseScore - riskPenalty - securityPenalty - bottleneckPenalty,
  );
  return Math.round(score);
};

function Layout() {
  const [selectedRepository, setSelectedRepository] = useState("Quantum-Core");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const location = useLocation();

  const repoConfig = repositoriesConfig[selectedRepository];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Icon
              name="hub"
              style={{
                fontVariationSettings:
                  "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48",
              }}
              className="text-2xl"
            />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-none">
            QuantumThread AI
          </h1>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === location.pathname;
            const isLink = item.path !== "#";

            if (isLink) {
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600/8 text-blue-600 border-r-2 border-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  {item.label}
                </Link>
              );
            }

            return (
              <a
                key={item.label}
                href={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Icon name={item.icon} className="text-[20px]" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Icon name="settings" className="text-[20px]" />
            Settings
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {/* Repository Selector Dropdown */}
            <select
              value={selectedRepository}
              onChange={(e) => setSelectedRepository(e.target.value)}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-sm font-medium bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {Object.keys(repositoriesConfig).map((repo) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>

            <div className="h-4 w-[1px] bg-slate-200"></div>

            {/* Branch Selector Dropdown */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="flex items-center px-2 py-1 bg-slate-100 rounded text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <option value="main">main</option>
              <option value="staging">staging</option>
              <option value="feature-auth">feature-auth</option>
            </select>

            <div className="relative w-full max-w-md ml-4">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"
              />
              <input
                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Search architecture, files, or agents..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Repository Confidence Badge */}
            {(() => {
              const metrics = repoConfig.metrics;
              const riskCount = parseInt(metrics[1].value);
              const securityCount = parseInt(metrics[2].value);
              const bottleneckCount = parseInt(metrics[3].value);
              const confidence = calculateConfidenceScore(
                riskCount,
                securityCount,
                bottleneckCount,
              );

              let badgeColor = "";
              if (confidence > 80) badgeColor = "text-emerald-600";
              else if (confidence > 50) badgeColor = "text-amber-600";
              else badgeColor = "text-red-600";

              return (
                <div className="text-xs text-slate-500 font-mono">
                  Confidence:{" "}
                  <span className={`font-semibold ${badgeColor}`}>
                    {confidence}%
                  </span>
                </div>
              );
            })()}

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-900 leading-none">
                  Sarah Jenkins
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Lead Architect
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ring-2 ring-slate-100">
                <img
                  alt="User Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaSC3V_JggewTzXn_y0sVM9dOD6-i7WCqESTtlmP0ceQim1m2FDw69gd7O2NZ1sCb6_Hu7qJABQ6_lnqf48gJMywakl91_af1RDEFne3Poh87tWqoW51qBt7EAZrT3NdEw1LIhZ7U0wKrAez28o4ZTExCTgCX-w3HxgoiaZn9q3f7GIJ9b_gfzijuDS-SXfoYXaZjsoGH8vbTxp59pjxbpE4jqNbThOCASmeh3clgc23WQgBmAnRWA-n2MpX9snDFZzCGuyR1R6Gvs"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <Outlet context={{ selectedRepository, selectedBranch, repoConfig }} />
      </div>
    </div>
  );
}

export default Layout;
