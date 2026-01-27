CREATE TABLE project_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_repositories_project_id ON project_repositories(project_id);

CREATE TABLE project_repo_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID NOT NULL REFERENCES project_repositories(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    language VARCHAR(64),
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(repo_id, path)
);

CREATE INDEX idx_project_repo_files_repo_id ON project_repo_files(repo_id);

CREATE TRIGGER update_project_repositories_updated_at BEFORE UPDATE ON project_repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_repo_files_updated_at BEFORE UPDATE ON project_repo_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
