ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'PUBLIC';

UPDATE listings SET visibility = 'PUBLIC' WHERE visibility IS NULL;

ALTER TABLE listings
    ALTER COLUMN visibility SET NOT NULL,
    ALTER COLUMN visibility SET DEFAULT 'PUBLIC';

ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS target_individual_id UUID REFERENCES individual_profiles (id),
    ADD COLUMN IF NOT EXISTS source_conversation_id UUID;

CREATE INDEX IF NOT EXISTS listings_visibility_status_idx ON listings (visibility, status);

ALTER TABLE offers
    ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings (id),
    ADD COLUMN IF NOT EXISTS result_application_id UUID REFERENCES applications (id);
