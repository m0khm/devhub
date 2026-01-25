CREATE TABLE deploy_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 22,
    username VARCHAR(255) NOT NULL,
    auth_type VARCHAR(50) NOT NULL,
    encrypted_password TEXT,
    encrypted_private_key TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deploy_servers_project_id ON deploy_servers(project_id);

CREATE TABLE deploy_audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    server_id UUID REFERENCES deploy_servers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deploy_audit_events_project_id ON deploy_audit_events(project_id);
CREATE INDEX idx_deploy_audit_events_server_id ON deploy_audit_events(server_id);
CREATE INDEX idx_deploy_audit_events_user_id ON deploy_audit_events(user_id);

CREATE TRIGGER update_deploy_servers_updated_at BEFORE UPDATE ON deploy_servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
