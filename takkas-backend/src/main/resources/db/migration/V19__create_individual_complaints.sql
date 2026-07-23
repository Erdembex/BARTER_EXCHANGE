CREATE TABLE IF NOT EXISTS individual_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    individual_profile_id UUID NOT NULL REFERENCES individual_profiles(id),
    reason VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS individual_complaints_status_idx ON individual_complaints (status);
CREATE INDEX IF NOT EXISTS individual_complaints_individual_idx ON individual_complaints (individual_profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS individual_complaints_reporter_individual_pending_idx
    ON individual_complaints (reporter_user_id, individual_profile_id)
    WHERE status = 'PENDING';
