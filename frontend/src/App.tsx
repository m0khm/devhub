import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { LandingPage } from './features/new-ui/pages/LandingPage';
import { AuthPage } from './features/new-ui/pages/AuthPage';
import { WorkspaceLayout } from './features/new-ui/pages/WorkspaceLayout';
import { ChatView } from './features/new-ui/components/workspace/ChatView';
import { KanbanView } from './features/new-ui/components/workspace/KanbanView';
import { CalendarView } from './features/new-ui/components/workspace/CalendarView';
import { FilesView } from './features/new-ui/components/workspace/FilesView';
import { DashboardView } from './features/new-ui/components/workspace/DashboardView';
import { HubPage } from './features/new-ui/pages/HubPage';
import { DeployPage } from './features/deploy/DeployPage';
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
        <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
        <Route
          path="/register"
          element={<Navigate to="/auth?mode=register" replace />}
        />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChatView />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="kanban" element={<KanbanView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="files" element={<FilesView />} />
          <Route path="dashboard" element={<DashboardView />} />
        </Route>
        <Route
          path="/hub"
          element={
            <ProtectedRoute>
              <HubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deploy/:projectId?"
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
