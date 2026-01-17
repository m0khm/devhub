CREATE TABLE direct_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(topic_id, user_id)
);

CREATE INDEX idx_direct_participants_topic_id ON direct_participants(topic_id);
CREATE INDEX idx_direct_participants_user_id ON direct_participants(user_id);
