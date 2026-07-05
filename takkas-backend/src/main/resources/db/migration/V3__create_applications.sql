CREATE TABLE applications (
    id            UUID PRIMARY KEY,
    listing_id    UUID NOT NULL,
    business_id   UUID NOT NULL,
    individual_id UUID NOT NULL REFERENCES individual_profiles (id),
    cover_letter  TEXT,
    status        VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    applied_at    TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ,
    CONSTRAINT uq_application_listing_individual UNIQUE (listing_id, individual_id)
);

CREATE INDEX applications_listing_status_idx ON applications (listing_id, status);
CREATE INDEX applications_individual_idx ON applications (individual_id, status);
