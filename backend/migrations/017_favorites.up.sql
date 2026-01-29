CREATE TABLE favorite_topics (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX idx_favorite_topics_user_id ON favorite_topics(user_id);
CREATE INDEX idx_favorite_topics_topic_id ON favorite_topics(topic_id);

CREATE TABLE favorite_messages (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, message_id)
);

CREATE INDEX idx_favorite_messages_user_id ON favorite_messages(user_id);
CREATE INDEX idx_favorite_messages_message_id ON favorite_messages(message_id);
