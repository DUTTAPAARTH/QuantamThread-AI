import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

const ModeSelector         = lazy(() => import("./pages/ModeSelector"));
const Dashboard            = lazy(() => import("./pages/Dashboard"));
const ArchitectureMap      = lazy(() => import("./pages/ArchitectureMap"));
const BugRisk              = lazy(() => import("./pages/BugRisk"));
const SecurityScanner      = lazy(() => import("./pages/SecurityScanner"));
const DependencyIntelligence = lazy(() => import("./pages/DependencyIntelligence"));
const RepositoryEvolution  = lazy(() => import("./pages/RepositoryEvolution"));
const CodeAssistant        = lazy(() => import("./pages/CodeAssistant"));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center" style={{ background: "#0B0F1A" }}>
    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Landing — choose mode */}
        <Route path="/" element={<ModeSelector />} />

        {/* Mode 1: Project Analysis (full layout with sidebar) */}
        <Route path="/project" element={<Layout mode="project" />}>
          <Route index element={<Dashboard />} />
          <Route path="architecture" element={<ArchitectureMap />} />
          <Route path="bug-risk" element={<BugRisk />} />
          <Route path="security" element={<SecurityScanner />} />
          <Route path="dependencies" element={<DependencyIntelligence />} />
          <Route path="evolution" element={<RepositoryEvolution />} />
        </Route>

        {/* Mode 2: AI Assistant (layout shell + chat) */}
        <Route path="/assistant" element={<Layout mode="assistant" />}>
          <Route index element={<CodeAssistant />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default Router;
