import React, { useEffect } from 'react';
import { DeployPage } from "./features/deploy/DeployPage";
import { CodePage } from "./features/code/CodePage";
import { CustomPage } from "./features/custom/CustomPage";
import { TermsPage } from "./features/legal/TermsPage";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { LoginPage } from './features/auth/components/LoginPage';
import { RegisterPage } from './features/auth/components/RegisterPage';
import { AdminPage } from './features/admin/AdminPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { LandingPage } from './features/landing/LandingPage';
import { HubPage } from './features/hub/HubPage';
import { PlanningPage } from './features/planning/PlanningPage';
import { WorkspaceLayout } from './features/workspace/WorkspaceLayout';
import { WorkspaceDashboardPage } from './features/workspace/WorkspaceDashboardPage';
import { WorkspaceChatPage } from './features/workspace/WorkspaceChatPage';
import { WorkspaceFilesPage } from './features/workspace/WorkspaceFilesPage';
import { WorkspaceNotificationsPage } from './features/workspace/WorkspaceNotificationsPage';
import { WorkspaceTopicsPage } from './features/workspace/WorkspaceTopicsPage';
import { WorkspaceVideoPage } from './features/workspace/WorkspaceVideoPage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  if (!isHydrated) {
    return null;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkspaceDashboardPage />} />
          <Route path="dashboard" element={<WorkspaceDashboardPage />} />
          <Route path="chat" element={<WorkspaceChatPage />} />
          <Route path="topics" element={<WorkspaceTopicsPage />} />
          <Route path="files" element={<WorkspaceFilesPage />} />
          <Route path="code" element={<CodePage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="deploy" element={<DeployPage />} />
          <Route path="hub" element={<HubPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<WorkspaceNotificationsPage />} />
          <Route path="video" element={<WorkspaceVideoPage />} />
          <Route path="custom" element={<CustomPage />} />
        </Route>
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkspaceDashboardPage />} />
          <Route path="dashboard" element={<WorkspaceDashboardPage />} />
          <Route path="chat" element={<WorkspaceChatPage />} />
          <Route path="topics" element={<WorkspaceTopicsPage />} />
          <Route path="files" element={<WorkspaceFilesPage />} />
          <Route path="code" element={<CodePage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="deploy" element={<DeployPage />} />
          <Route path="hub" element={<HubPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<WorkspaceNotificationsPage />} />
          <Route path="video" element={<WorkspaceVideoPage />} />
          <Route path="custom" element={<CustomPage />} />
        </Route>
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
