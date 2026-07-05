ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS submission_text TEXT,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_note TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS application_submission_images (
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    image_url VARCHAR(2048) NOT NULL
);

CREATE INDEX IF NOT EXISTS application_submission_images_app_idx
    ON application_submission_images(application_id);
