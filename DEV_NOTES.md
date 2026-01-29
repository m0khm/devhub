# DEV_NOTES

## Reuse vs. new additions

### Reused
- **Project creation flow**: The existing project creation logic (default topics, owner membership, kanban seed) is reused via the project service when creating projects inside a workspace.
- **Frontend project state**: The existing project store continues to track the active project and list of projects, now driven by workspace-scoped API responses.

### New
- **Workspace domain**: Added workspace models, repository, service, and handlers to support workspace creation, membership, and scoped project listing/creation.
- **Workspace migrations**: Added migrations for `workspaces`, `workspace_members`, and a `workspace_id` column on projects.
- **Join project flow**: Added `/projects/join` endpoint to attach a user to an existing project and its workspace membership.
- **Onboarding flow**: Updated the onboarding page to create/select workspaces, create projects, or join by project ID.
- **Workspace UI**: Added live workspace header and project dropdown backed by the new API endpoints.
