CREATE TABLE deploy_settings (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    strategy VARCHAR(100) NOT NULL,
    build_command VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE deploy_env_vars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key VARCHAR(120) NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, key)
);

CREATE INDEX idx_deploy_env_vars_project_id ON deploy_env_vars(project_id);

CREATE TRIGGER update_deploy_settings_updated_at BEFORE UPDATE ON deploy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deploy_env_vars_updated_at BEFORE UPDATE ON deploy_env_vars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
