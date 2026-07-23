-- Integration test kalıntılarını temizle (Test Cafe*, @test.dev hesapları)

CREATE TEMP TABLE tmp_test_applications ON COMMIT DROP AS
SELECT a.id AS application_id
FROM applications a
JOIN listings l ON a.listing_id = l.id
JOIN business_profiles b ON l.business_id = b.id
JOIN users u ON b.user_id = u.id
WHERE b.business_name LIKE 'Test Cafe%'
   OR u.email LIKE '%@test.dev';

CREATE TEMP TABLE tmp_test_listings ON COMMIT DROP AS
SELECT l.id AS listing_id
FROM listings l
JOIN business_profiles b ON l.business_id = b.id
JOIN users u ON b.user_id = u.id
WHERE b.business_name LIKE 'Test Cafe%'
   OR u.email LIKE '%@test.dev';

DELETE FROM business_complaints
WHERE application_id IN (SELECT application_id FROM tmp_test_applications);

DELETE FROM individual_complaints
WHERE application_id IN (SELECT application_id FROM tmp_test_applications);

DELETE FROM task_feedback
WHERE application_id IN (SELECT application_id FROM tmp_test_applications);

DELETE FROM coupons
WHERE application_id IN (SELECT application_id FROM tmp_test_applications);

DELETE FROM messages
WHERE conversation_id IN (
    SELECT c.id FROM conversations c
    WHERE c.application_id IN (SELECT application_id FROM tmp_test_applications)
);

DELETE FROM conversations
WHERE application_id IN (SELECT application_id FROM tmp_test_applications);

DELETE FROM applications
WHERE id IN (SELECT application_id FROM tmp_test_applications);

DELETE FROM listing_skills
WHERE listing_id IN (SELECT listing_id FROM tmp_test_listings);

DELETE FROM listing_rewards
WHERE listing_id IN (SELECT listing_id FROM tmp_test_listings);

DELETE FROM listings
WHERE id IN (SELECT listing_id FROM tmp_test_listings);

-- Gerçek işletmelerin taslak görevlerini yayına al
UPDATE listings l
SET status = 'ACTIVE'
FROM business_profiles b
JOIN users u ON b.user_id = u.id
WHERE l.business_id = b.id
  AND l.status = 'DRAFT'
  AND b.business_name NOT LIKE 'Test Cafe%'
  AND u.email NOT LIKE '%@test.dev';
