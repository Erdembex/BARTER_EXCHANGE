CREATE TABLE IF NOT EXISTS business_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    business_profile_id UUID NOT NULL REFERENCES business_profiles(id),
    reason VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS business_complaints_status_idx ON business_complaints (status);
CREATE INDEX IF NOT EXISTS business_complaints_business_idx ON business_complaints (business_profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS business_complaints_reporter_business_pending_idx
    ON business_complaints (reporter_user_id, business_profile_id)
    WHERE status = 'PENDING';
