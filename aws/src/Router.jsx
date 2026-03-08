import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ArchitectureMap from "./pages/ArchitectureMap";
import BugRisk from "./pages/BugRisk";
import SecurityScanner from "./pages/SecurityScanner";
import DependencyIntelligence from "./pages/DependencyIntelligence";
import RepositoryEvolution from "./pages/RepositoryEvolution";

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="architecture" element={<ArchitectureMap />} />
        <Route path="bug-risk" element={<BugRisk />} />
        <Route path="security" element={<SecurityScanner />} />
        <Route path="dependencies" element={<DependencyIntelligence />} />
        <Route path="evolution" element={<RepositoryEvolution />} />
      </Route>
    </Routes>
  );
}

export default Router;
