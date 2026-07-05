CREATE TABLE fcm_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL,
    token      VARCHAR(512) NOT NULL UNIQUE,
    platform   VARCHAR(50),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX fcm_tokens_user_idx ON fcm_tokens (user_id, is_active);
