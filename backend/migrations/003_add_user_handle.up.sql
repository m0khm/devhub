ALTER TABLE users
    ADD COLUMN handle VARCHAR(255);

CREATE UNIQUE INDEX idx_users_handle ON users(handle);
