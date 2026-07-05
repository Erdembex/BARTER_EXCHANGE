CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations (id),
    sender_id       UUID NOT NULL,
    message_type    VARCHAR(50) NOT NULL DEFAULT 'TEXT',
    content         TEXT,
    created_at      TIMESTAMPTZ,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS messages_conv_created_idx ON messages (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS offers (
    id            UUID PRIMARY KEY,
    message_id    UUID NOT NULL UNIQUE REFERENCES messages (id),
    reward_type   VARCHAR(50),
    quantity      INTEGER,
    unit          VARCHAR(50),
    validity_days INTEGER,
    note          TEXT,
    status        VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    responded_at  TIMESTAMPTZ
);
