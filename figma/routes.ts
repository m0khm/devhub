import { createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { WorkspaceLayout } from './pages/WorkspaceLayout';
import { ChatView } from './components/workspace/ChatView';
import { KanbanView } from './components/workspace/KanbanView';
import { CalendarView } from './components/workspace/CalendarView';
import { FilesView } from './components/workspace/FilesView';
import { DashboardView } from './components/workspace/DashboardView';
import { HubPage } from './pages/HubPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/auth',
    Component: AuthPage,
  },
  {
    path: '/workspace',
    Component: WorkspaceLayout,
    children: [
      { index: true, Component: ChatView },
      { path: 'chat', Component: ChatView },
      { path: 'kanban', Component: KanbanView },
      { path: 'calendar', Component: CalendarView },
      { path: 'files', Component: FilesView },
      { path: 'dashboard', Component: DashboardView },
    ],
  },
  {
    path: '/hub',
    Component: HubPage,
  },
]);
