DROP INDEX IF EXISTS idx_projects_workspace_id;
ALTER TABLE projects DROP COLUMN IF EXISTS workspace_id;

DROP INDEX IF EXISTS idx_workspace_members_user_id;
DROP INDEX IF EXISTS idx_workspace_members_workspace_id;
DROP TABLE IF EXISTS workspace_members;
DROP TABLE IF EXISTS workspaces;
