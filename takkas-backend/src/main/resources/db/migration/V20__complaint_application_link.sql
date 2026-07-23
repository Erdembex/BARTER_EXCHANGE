ALTER TABLE business_complaints
    ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id);

ALTER TABLE individual_complaints
    ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id);

DROP INDEX IF EXISTS business_complaints_reporter_business_pending_idx;
DROP INDEX IF EXISTS individual_complaints_reporter_individual_pending_idx;

CREATE UNIQUE INDEX IF NOT EXISTS business_complaints_reporter_application_pending_idx
    ON business_complaints (reporter_user_id, application_id)
    WHERE status = 'PENDING' AND application_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS individual_complaints_reporter_application_pending_idx
    ON individual_complaints (reporter_user_id, application_id)
    WHERE status = 'PENDING' AND application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS business_complaints_application_idx ON business_complaints (application_id);
CREATE INDEX IF NOT EXISTS individual_complaints_application_idx ON individual_complaints (application_id);
