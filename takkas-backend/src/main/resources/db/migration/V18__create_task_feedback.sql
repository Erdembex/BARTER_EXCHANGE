CREATE TABLE IF NOT EXISTS task_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id),
    author_user_id UUID NOT NULL REFERENCES users(id),
    author_role VARCHAR(20) NOT NULL,
    target_profile_id UUID NOT NULL,
    stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT task_feedback_unique_author UNIQUE (application_id, author_user_id)
);

CREATE INDEX IF NOT EXISTS task_feedback_target_idx ON task_feedback (target_profile_id, author_role);
