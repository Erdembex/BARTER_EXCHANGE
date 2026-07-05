CREATE TABLE coupons (
    id             UUID PRIMARY KEY,
    application_id UUID NOT NULL UNIQUE,
    owner_id       UUID NOT NULL,
    business_id    UUID NOT NULL,
    reward_type    VARCHAR(50) NOT NULL,
    quantity       INTEGER NOT NULL,
    unit           VARCHAR(50),
    description    TEXT,
    qr_token       VARCHAR(255) UNIQUE,
    status         VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    validity_days  INTEGER NOT NULL,
    issued_at      TIMESTAMPTZ,
    expires_at     TIMESTAMPTZ,
    used_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ
);

CREATE INDEX coupons_owner_status_idx ON coupons (owner_id, status);
CREATE INDEX coupons_qr_token_idx ON coupons (qr_token);
CREATE INDEX coupons_business_idx ON coupons (business_id, status);
CREATE INDEX coupons_application_idx ON coupons (application_id);
