import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Shell from "./components/layout/Shell.jsx";
import Login from "./pages/auth/Login.jsx";
import WillAssistant from "./pages/will-assistant/WillAssistant.jsx";
import Vault from "./pages/vault/Vault.jsx";
import Guardians from "./pages/guardians/Guardians.jsx";
import Messages from "./pages/messages/Messages.jsx";
import FamilyDashboard from "./pages/family-dashboard/FamilyDashboard.jsx";
import ReportPassing from "./pages/report/ReportPassing.jsx";
import Executor from "./pages/executor/Executor.jsx";

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/family/:userId" element={<FamilyDashboard />} />
      <Route path="/report/:userId" element={<ReportPassing />} />
      <Route path="/app" element={<Protected><Shell /></Protected>}>
        <Route index element={<Navigate to="assistant" replace />} />
        <Route path="assistant" element={<WillAssistant />} />
        <Route path="vault" element={<Vault />} />
        <Route path="guardians" element={<Guardians />} />
        <Route path="messages" element={<Messages />} />
        <Route path="executor" element={<Executor />} />
      </Route>
    </Routes>
  );
}
