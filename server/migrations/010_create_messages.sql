-- Create Messages Table for donor, NGO, and receiver conversations
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_post_id INTEGER REFERENCES food_posts(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL CHECK (length(trim(message_text)) > 0),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT messages_sender_receiver_different CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (sender_id, receiver_id, food_post_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver
    ON messages (receiver_id, sent_at DESC);