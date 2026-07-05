CREATE TABLE subscription_plans (
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

CREATE TABLE plan_features (
    id            UUID PRIMARY KEY,
    plan_id       UUID NOT NULL REFERENCES subscription_plans (id),
    feature_key   VARCHAR(255) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    CONSTRAINT uq_plan_feature_key UNIQUE (plan_id, feature_key)
);

CREATE TABLE business_subscriptions (
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

CREATE TABLE subscription_invoices (
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
