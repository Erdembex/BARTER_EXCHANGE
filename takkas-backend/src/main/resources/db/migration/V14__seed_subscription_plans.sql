-- Subscription plan seed verileri
INSERT INTO subscription_plans (id, name, display_name, price_monthly, price_yearly, is_active, created_at)
VALUES
    (gen_random_uuid(), 'FREE',     'Ücretsiz', 0,      0,      TRUE, NOW()),
    (gen_random_uuid(), 'STANDARD', 'Standart', 299.00, 2990.00, TRUE, NOW()),
    (gen_random_uuid(), 'PRO',      'Pro',       699.00, 6990.00, TRUE, NOW())
ON CONFLICT (name) DO NOTHING;

-- FREE plan özellikleri
INSERT INTO plan_features (id, plan_id, feature_key, feature_value)
SELECT gen_random_uuid(), p.id, f.key, f.val
FROM subscription_plans p
CROSS JOIN (VALUES
    ('MAX_ACTIVE_LISTINGS',          '2'),
    ('MAX_UNDER_REVIEW_PER_LISTING', '3'),
    ('CAN_FEATURE_LISTING',          'false'),
    ('CAN_SEE_APPLICANT_CONTACTS',   'false'),
    ('SWAP_MARKET_ACCESS',           'false'),
    ('ANALYTICS_ACCESS',             'false'),
    ('PRIORITY_SUPPORT',             'false')
) AS f(key, val)
WHERE p.name = 'FREE'
ON CONFLICT ON CONSTRAINT uq_plan_feature_key DO NOTHING;

-- STANDARD plan özellikleri
INSERT INTO plan_features (id, plan_id, feature_key, feature_value)
SELECT gen_random_uuid(), p.id, f.key, f.val
FROM subscription_plans p
CROSS JOIN (VALUES
    ('MAX_ACTIVE_LISTINGS',          '10'),
    ('MAX_UNDER_REVIEW_PER_LISTING', '10'),
    ('CAN_FEATURE_LISTING',          'false'),
    ('CAN_SEE_APPLICANT_CONTACTS',   'true'),
    ('SWAP_MARKET_ACCESS',           'true'),
    ('ANALYTICS_ACCESS',             'false'),
    ('PRIORITY_SUPPORT',             'false')
) AS f(key, val)
WHERE p.name = 'STANDARD'
ON CONFLICT ON CONSTRAINT uq_plan_feature_key DO NOTHING;

-- PRO plan özellikleri
INSERT INTO plan_features (id, plan_id, feature_key, feature_value)
SELECT gen_random_uuid(), p.id, f.key, f.val
FROM subscription_plans p
CROSS JOIN (VALUES
    ('MAX_ACTIVE_LISTINGS',          'unlimited'),
    ('MAX_UNDER_REVIEW_PER_LISTING', 'unlimited'),
    ('CAN_FEATURE_LISTING',          'true'),
    ('CAN_SEE_APPLICANT_CONTACTS',   'true'),
    ('SWAP_MARKET_ACCESS',           'true'),
    ('ANALYTICS_ACCESS',             'true'),
    ('PRIORITY_SUPPORT',             'true')
) AS f(key, val)
WHERE p.name = 'PRO'
ON CONFLICT ON CONSTRAINT uq_plan_feature_key DO NOTHING;
