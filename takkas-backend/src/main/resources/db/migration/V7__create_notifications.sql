CREATE TABLE notifications (
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL,
    type           VARCHAR(50) NOT NULL,
    reference_id   UUID,
    reference_type VARCHAR(50),
    title          VARCHAR(255) NOT NULL,
    body           TEXT NOT NULL,
    is_read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ
);

CREATE INDEX notif_user_unread_idx ON notifications (user_id, is_read, created_at DESC);
