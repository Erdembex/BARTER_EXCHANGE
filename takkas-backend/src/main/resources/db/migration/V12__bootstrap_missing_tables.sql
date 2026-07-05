-- Bootstrap tables when earlier migrations were applied empty.

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type     VARCHAR(50)  NOT NULL,
    status        VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ,
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

CREATE TABLE IF NOT EXISTS business_profiles (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL UNIQUE REFERENCES users (id),
    business_name VARCHAR(255) NOT NULL,
    category      VARCHAR(50),
    city          VARCHAR(255),
    district      VARCHAR(255),
    phone         VARCHAR(50),
    logo_url      VARCHAR(512),
    bio           TEXT,
    verified      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS individual_profiles (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL UNIQUE REFERENCES users (id),
    full_name  VARCHAR(255) NOT NULL,
    city       VARCHAR(255),
    district   VARCHAR(255),
    avatar_url VARCHAR(512),
    bio        TEXT,
    created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS individual_skills (
    id            UUID PRIMARY KEY,
    individual_id UUID NOT NULL REFERENCES individual_profiles (id),
    skill         VARCHAR(50) NOT NULL,
    UNIQUE (individual_id, skill)
);

CREATE TABLE IF NOT EXISTS listings (
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

CREATE INDEX IF NOT EXISTS listings_business_status_idx ON listings (business_id, status);
CREATE INDEX IF NOT EXISTS listings_status_idx ON listings (status);

CREATE TABLE IF NOT EXISTS listing_rewards (
    id            UUID PRIMARY KEY,
    listing_id    UUID NOT NULL UNIQUE REFERENCES listings (id),
    reward_type   VARCHAR(50) NOT NULL,
    quantity      INTEGER NOT NULL,
    unit          VARCHAR(50),
    validity_days INTEGER NOT NULL,
    description   TEXT
);

CREATE TABLE IF NOT EXISTS listing_skills (
    id         UUID PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings (id),
    skill      VARCHAR(50) NOT NULL,
    UNIQUE (listing_id, skill)
);

CREATE TABLE IF NOT EXISTS applications (
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

CREATE INDEX IF NOT EXISTS applications_listing_status_idx ON applications (listing_id, status);
CREATE INDEX IF NOT EXISTS applications_individual_idx ON applications (individual_id, status);

CREATE TABLE IF NOT EXISTS coupons (
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

CREATE INDEX IF NOT EXISTS coupons_owner_status_idx ON coupons (owner_id, status);
CREATE INDEX IF NOT EXISTS coupons_qr_token_idx ON coupons (qr_token);
CREATE INDEX IF NOT EXISTS coupons_business_idx ON coupons (business_id, status);
CREATE INDEX IF NOT EXISTS coupons_application_idx ON coupons (application_id);

CREATE TABLE IF NOT EXISTS swap_listings (
    id                  UUID PRIMARY KEY,
    owner_id            UUID NOT NULL,
    offered_coupon_id   UUID NOT NULL UNIQUE,
    wanted_reward_type  VARCHAR(50) NOT NULL,
    wanted_quantity     INTEGER NOT NULL,
    wanted_description  TEXT,
    status              VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at          TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS swap_listings_status_reward_idx ON swap_listings (status, wanted_reward_type);
CREATE INDEX IF NOT EXISTS swap_listings_owner_idx ON swap_listings (owner_id);
CREATE INDEX IF NOT EXISTS swap_listings_coupon_idx ON swap_listings (offered_coupon_id);

CREATE TABLE IF NOT EXISTS swap_offers (
    id                UUID PRIMARY KEY,
    swap_listing_id   UUID NOT NULL REFERENCES swap_listings (id),
    offerer_id        UUID NOT NULL,
    offered_coupon_id UUID NOT NULL,
    message           TEXT,
    status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMPTZ,
    CONSTRAINT uq_swap_offer_listing_offerer UNIQUE (swap_listing_id, offerer_id)
);

CREATE INDEX IF NOT EXISTS swap_offers_listing_idx ON swap_offers (swap_listing_id, status);
CREATE INDEX IF NOT EXISTS swap_offers_offerer_idx ON swap_offers (offerer_id);

CREATE TABLE IF NOT EXISTS swap_trades (
    id                     UUID PRIMARY KEY,
    swap_listing_id        UUID NOT NULL UNIQUE REFERENCES swap_listings (id),
    swap_offer_id          UUID NOT NULL UNIQUE REFERENCES swap_offers (id),
    initiator_coupon_id    UUID NOT NULL,
    receiver_coupon_id     UUID NOT NULL,
    initiator_new_owner_id UUID NOT NULL,
    receiver_new_owner_id  UUID NOT NULL,
    completed_at           TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id                      UUID PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL UNIQUE,
    display_name            VARCHAR(255) NOT NULL,
    price_monthly           NUMERIC(19, 2) NOT NULL DEFAULT 0,
    price_yearly            NUMERIC(19, 2) NOT NULL DEFAULT 0,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly  VARCHAR(255),
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS plan_features (
    id            UUID PRIMARY KEY,
    plan_id       UUID NOT NULL REFERENCES subscription_plans (id),
    feature_key   VARCHAR(255) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    CONSTRAINT uq_plan_feature_key UNIQUE (plan_id, feature_key)
);

CREATE TABLE IF NOT EXISTS business_subscriptions (
    id                     UUID PRIMARY KEY,
    business_id            UUID NOT NULL UNIQUE,
    plan_id                UUID NOT NULL REFERENCES subscription_plans (id),
    status                 VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    stripe_customer_id     VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    current_period_start   TIMESTAMPTZ,
    current_period_end     TIMESTAMPTZ,
    cancel_at_period_end   BOOLEAN NOT NULL DEFAULT FALSE,
    past_due_since         TIMESTAMPTZ,
    created_at             TIMESTAMPTZ,
    updated_at             TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS subscription_invoices (
    id                UUID PRIMARY KEY,
    subscription_id   UUID NOT NULL REFERENCES business_subscriptions (id),
    stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
    amount            NUMERIC(19, 2) NOT NULL,
    currency          VARCHAR(10) NOT NULL DEFAULT 'TRY',
    status            VARCHAR(50) NOT NULL,
    invoice_url       VARCHAR(512),
    paid_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL,
    type           VARCHAR(50) NOT NULL,
    reference_id   UUID,
    reference_type VARCHAR(50),
    title          VARCHAR(255) NOT NULL,
    body           TEXT NOT NULL,
    is_read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notif_user_unread_idx ON notifications (user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id),
    token      VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fcm_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL,
    token      VARCHAR(512) NOT NULL UNIQUE,
    platform   VARCHAR(50),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS fcm_tokens_user_idx ON fcm_tokens (user_id, is_active);

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

CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations (id),
    sender_id       UUID NOT NULL,
    message_type    VARCHAR(50) NOT NULL DEFAULT 'TEXT',
    content         TEXT,
    created_at      TIMESTAMPTZ,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS messages_conv_created_idx ON messages (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS offers (
    id            UUID PRIMARY KEY,
    message_id    UUID NOT NULL UNIQUE REFERENCES messages (id),
    reward_type   VARCHAR(50),
    quantity      INTEGER,
    unit          VARCHAR(50),
    validity_days INTEGER,
    note          TEXT,
    status        VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    responded_at  TIMESTAMPTZ
);
