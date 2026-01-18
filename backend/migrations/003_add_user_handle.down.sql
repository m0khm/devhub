DROP INDEX IF EXISTS idx_users_handle;

ALTER TABLE users
    DROP COLUMN IF EXISTS handle;
