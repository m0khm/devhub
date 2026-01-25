CREATE TABLE pinned_messages (
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (topic_id, message_id)
);

CREATE INDEX idx_pinned_messages_topic_id ON pinned_messages(topic_id);
