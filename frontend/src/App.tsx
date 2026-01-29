import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { LandingPage } from './features/new-ui/pages/LandingPage';
import { AuthPage } from './features/new-ui/pages/AuthPage';
import { WorkspaceLayout } from './features/new-ui/pages/WorkspaceLayout';
import { FilesView } from './features/new-ui/components/workspace/FilesView';
import { ChatView } from "./features/new-ui/components/workspace/ChatView";
import { DashboardView } from './features/new-ui/components/workspace/DashboardView';
import { HubPage } from './features/new-ui/pages/HubPage';
import { CreateProjectPage } from './features/new-ui/pages/CreateProjectPage';
import { PlanningPage } from "./features/planning/PlanningPage";
import { DeployPage } from './features/deploy/DeployPage';
import { CodePage } from "./features/code/CodePage";
import { DeployRedirect, LegacyDeployRedirect } from './features/deploy/DeployRedirect';
import { ProfilePage } from './features/profile/ProfilePage';
import { TermsPage } from './features/legal/TermsPage';
import { PrivacyPage } from './features/legal/PrivacyPage';
import { ContactPage } from './features/legal/ContactPage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  if (!isHydrated) {
      return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>Loading…</div>;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth?mode=login" />;
};

function App() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const theme = useThemeStore((state) => state.theme);
  const loadThemeFromStorage = useThemeStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
    loadThemeFromStorage();
  }, [loadFromStorage, loadThemeFromStorage]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="chat" replace />} />
          <Route path="chat/:projectId?" element={<ChatView />} />
          <Route path="deploy/:projectId?" element={<DeployPage />} />
          <Route path="planning/:projectId?" element={<PlanningPage />} />
          <Route path="code/:projectId?" element={<CodePage />} />
          <Route path="files" element={<FilesView />} />
          <Route path="hub" element={<HubPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <CreateProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub"
          element={
            <ProtectedRoute>
              <HubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deploy"
          element={
            <ProtectedRoute>
              <DeployRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deploy/:projectId"
          element={
            <ProtectedRoute>
              <LegacyDeployRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/deploy"
          element={
            <ProtectedRoute>
              <DeployPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
