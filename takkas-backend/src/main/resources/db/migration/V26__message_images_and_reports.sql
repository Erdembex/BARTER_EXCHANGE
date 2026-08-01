ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url VARCHAR(2048);

CREATE TABLE IF NOT EXISTS message_image_reports (
    id               UUID PRIMARY KEY,
    message_id       UUID NOT NULL REFERENCES messages (id),
    conversation_id  UUID NOT NULL REFERENCES conversations (id),
    reporter_user_id UUID NOT NULL,
    reported_user_id UUID NOT NULL,
    media_url        VARCHAR(2048) NOT NULL,
    reason           VARCHAR(50) NOT NULL,
    description      TEXT NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_note       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS message_image_reports_status_idx
    ON message_image_reports (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_message_image_report_reporter
    ON message_image_reports (message_id, reporter_user_id);
