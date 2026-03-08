import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ModeSelector from "./pages/ModeSelector";
import Dashboard from "./pages/Dashboard";
import ArchitectureMap from "./pages/ArchitectureMap";
import BugRisk from "./pages/BugRisk";
import SecurityScanner from "./pages/SecurityScanner";
import DependencyIntelligence from "./pages/DependencyIntelligence";
import RepositoryEvolution from "./pages/RepositoryEvolution";
import CodeAssistant from "./pages/CodeAssistant";

function Router() {
  return (
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
  );
}

export default Router;
