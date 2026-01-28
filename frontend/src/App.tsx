import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { LandingPage } from './features/new-ui/pages/LandingPage';
import { AuthPage } from './features/new-ui/pages/AuthPage';
import { WorkspaceLayout } from './features/new-ui/pages/WorkspaceLayout';
import { FilesView } from './features/new-ui/components/workspace/FilesView';
import { ProjectWorkspace } from './features/projects/components/ProjectWorkspace';
import { DeployPage } from './features/deploy/DeployPage';
import { PlanningPage } from './features/planning/PlanningPage';
import { CodePage } from './features/code/CodePage';
import { HubPage } from './features/hub/HubPage';
import { ProfilePage } from './features/profile/ProfilePage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  if (!isHydrated) {
    return null;
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
          <Route path="chat/:projectId?" element={<ProjectWorkspace />} />
          <Route path="deploy/:projectId?" element={<DeployPage />} />
          <Route path="planning/:projectId?" element={<PlanningPage />} />
          <Route path="code/:projectId?" element={<CodePage />} />
          <Route path="files" element={<FilesView />} />
          <Route path="hub" element={<HubPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
