CREATE TABLE email_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_confirmations_email ON email_confirmations(email);
CREATE INDEX idx_email_confirmations_expires_at ON email_confirmations(expires_at);

CREATE TRIGGER update_email_confirmations_updated_at BEFORE UPDATE ON email_confirmations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
