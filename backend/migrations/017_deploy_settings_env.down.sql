DROP TRIGGER IF EXISTS update_deploy_env_vars_updated_at ON deploy_env_vars;
DROP TRIGGER IF EXISTS update_deploy_settings_updated_at ON deploy_settings;

DROP TABLE IF EXISTS deploy_env_vars;
DROP TABLE IF EXISTS deploy_settings;
