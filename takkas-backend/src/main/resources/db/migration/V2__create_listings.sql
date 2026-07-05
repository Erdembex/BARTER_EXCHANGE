CREATE TABLE listings (
    id           UUID PRIMARY KEY,
    business_id  UUID NOT NULL REFERENCES business_profiles (id),
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    weekly_hours VARCHAR(50),
    status       VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    view_count   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ
);

CREATE INDEX listings_business_status_idx ON listings (business_id, status);
CREATE INDEX listings_status_idx ON listings (status);

CREATE TABLE listing_rewards (
    id            UUID PRIMARY KEY,
    listing_id    UUID NOT NULL UNIQUE REFERENCES listings (id),
    reward_type   VARCHAR(50) NOT NULL,
    quantity      INTEGER NOT NULL,
    unit          VARCHAR(50),
    validity_days INTEGER NOT NULL,
    description   TEXT
);

CREATE TABLE listing_skills (
    id         UUID PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings (id),
    skill      VARCHAR(50) NOT NULL,
    UNIQUE (listing_id, skill)
);
