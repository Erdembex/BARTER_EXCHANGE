-- 6 aylık paket fiyatı + Stripe (ileride kullanılacak) 6 aylık price id kolonu
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_semi_annual NUMERIC(19, 2) NOT NULL DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id_semi_annual VARCHAR(255);

-- Sanal POS bağlanana kadar: işletme yükseltme talep eder, admin ödemeyi manuel onaylayınca plan aktive olur.
ALTER TABLE business_subscriptions ADD COLUMN IF NOT EXISTS pending_plan_id UUID REFERENCES subscription_plans (id);
ALTER TABLE business_subscriptions ADD COLUMN IF NOT EXISTS pending_billing_period VARCHAR(20);
ALTER TABLE business_subscriptions ADD COLUMN IF NOT EXISTS pending_reference VARCHAR(64);
ALTER TABLE business_subscriptions ADD COLUMN IF NOT EXISTS pending_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS business_subscriptions_pending_plan_idx ON business_subscriptions (pending_plan_id);

-- Mevcut planlara 6 aylık fiyat tanımla (aylık fiyatın ~%10-11 indirimlisi)
UPDATE subscription_plans SET price_semi_annual = 1590.00 WHERE name = 'STANDARD';
UPDATE subscription_plans SET price_semi_annual = 3770.00 WHERE name = 'PRO';
