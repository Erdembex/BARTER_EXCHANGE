CREATE TABLE IF NOT EXISTS conversations (
    id                 UUID PRIMARY KEY,
    application_id     UUID NOT NULL UNIQUE,
    business_user_id   UUID NOT NULL,
    individual_user_id UUID NOT NULL,
    status             VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at         TIMESTAMPTZ,
    closed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS conv_business_user_idx ON conversations (business_user_id);
CREATE INDEX IF NOT EXISTS conv_individual_user_idx ON conversations (individual_user_id);
