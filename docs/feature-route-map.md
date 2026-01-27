# Feature & Route Map (Frontend)

## Public routes
| Route | Feature | Key component(s) |
| --- | --- | --- |
| `/` | Landing | `LandingPage` |
| `/login` | Auth | `LoginPage` |
| `/register` | Auth | `RegisterPage` |
| `/terms` | Legal | `TermsPage` |

## Protected routes
| Route | Feature | Key component(s) |
| --- | --- | --- |
| `/admin` | Admin | `AdminPage` |
| `/hub` | Hub (global) | `HubPage` |
| `/profile` | Profile (global) | `ProfilePage` |
| `/app` | Workspace layout | `WorkspaceLayout` |
| `/projects/:projectId` | Workspace layout | `WorkspaceLayout` |

## Workspace layout routes
These routes share the new workspace layout and are accessible via the workspace navigation.

| Route | Feature | Key component(s) |
| --- | --- | --- |
| `/app` (index) | Workspace dashboard | `WorkspaceDashboardPage` |
| `/app/dashboard` | Workspace dashboard | `WorkspaceDashboardPage` |
| `/app/chat` | Messages | `WorkspaceChatPage`, `ChatView` |
| `/app/topics` | Topics | `WorkspaceTopicsPage`, `TopicSidebar` |
| `/app/files` | Files | `WorkspaceFilesPage` |
| `/app/code` | Code | `CodePage` |
| `/app/planning` | Planning | `PlanningPage` |
| `/app/deploy` | Deploy | `DeployPage` |
| `/app/hub` | Hub | `HubPage` |
| `/app/profile` | Profile | `ProfilePage` |
| `/app/notifications` | Notifications | `WorkspaceNotificationsPage`, `NotificationBell` |
| `/app/video` | Video | `WorkspaceVideoPage`, `VideoCallButton` |
| `/app/custom` | Workspace customization | `CustomPage` |

| Route | Feature | Key component(s) |
| --- | --- | --- |
| `/projects/:projectId` (index) | Workspace dashboard | `WorkspaceDashboardPage` |
| `/projects/:projectId/dashboard` | Workspace dashboard | `WorkspaceDashboardPage` |
| `/projects/:projectId/chat` | Messages | `WorkspaceChatPage`, `ChatView` |
| `/projects/:projectId/topics` | Topics | `WorkspaceTopicsPage`, `TopicSidebar` |
| `/projects/:projectId/files` | Files | `WorkspaceFilesPage` |
| `/projects/:projectId/code` | Code | `CodePage` |
| `/projects/:projectId/planning` | Planning | `PlanningPage` |
| `/projects/:projectId/deploy` | Deploy | `DeployPage` |
| `/projects/:projectId/hub` | Hub | `HubPage` |
| `/projects/:projectId/profile` | Profile | `ProfilePage` |
| `/projects/:projectId/notifications` | Notifications | `WorkspaceNotificationsPage`, `NotificationBell` |
| `/projects/:projectId/video` | Video | `WorkspaceVideoPage`, `VideoCallButton` |
| `/projects/:projectId/custom` | Workspace customization | `CustomPage` |

## Features without dedicated routes (components used inside workspace)
| Feature | Component(s) | Notes |
| --- | --- | --- |
| Projects | `ProjectSidebar`, `ProjectSettingsModal` | Project selector and settings modal inside workspace layout. |
| Messages | `ChatView` | Rendered within the workspace chat module. |
| Topics | `TopicSidebar` | Rendered within the workspace topics module. |
| Notifications | `NotificationBell` | Rendered in the workspace header and notifications page. |
| Video | `VideoCallButton`, `JitsiMeet` | Launches calls from the workspace video module. |
