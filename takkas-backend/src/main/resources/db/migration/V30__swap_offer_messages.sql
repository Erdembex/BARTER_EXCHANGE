CREATE TABLE swap_offer_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swap_offer_id   UUID NOT NULL REFERENCES swap_offers(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL,
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX swap_offer_messages_offer_idx ON swap_offer_messages (swap_offer_id, created_at);
