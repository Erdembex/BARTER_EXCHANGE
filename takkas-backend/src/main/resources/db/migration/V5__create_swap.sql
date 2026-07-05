CREATE TABLE swap_listings (
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

CREATE INDEX swap_listings_status_reward_idx ON swap_listings (status, wanted_reward_type);
CREATE INDEX swap_listings_owner_idx ON swap_listings (owner_id);
CREATE INDEX swap_listings_coupon_idx ON swap_listings (offered_coupon_id);

CREATE TABLE swap_offers (
    id                UUID PRIMARY KEY,
    swap_listing_id   UUID NOT NULL REFERENCES swap_listings (id),
    offerer_id        UUID NOT NULL,
    offered_coupon_id UUID NOT NULL,
    message           TEXT,
    status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMPTZ,
    CONSTRAINT uq_swap_offer_listing_offerer UNIQUE (swap_listing_id, offerer_id)
);

CREATE INDEX swap_offers_listing_idx ON swap_offers (swap_listing_id, status);
CREATE INDEX swap_offers_offerer_idx ON swap_offers (offerer_id);

CREATE TABLE swap_trades (
    id                     UUID PRIMARY KEY,
    swap_listing_id        UUID NOT NULL UNIQUE REFERENCES swap_listings (id),
    swap_offer_id          UUID NOT NULL UNIQUE REFERENCES swap_offers (id),
    initiator_coupon_id    UUID NOT NULL,
    receiver_coupon_id     UUID NOT NULL,
    initiator_new_owner_id UUID NOT NULL,
    receiver_new_owner_id  UUID NOT NULL,
    completed_at           TIMESTAMPTZ
);
