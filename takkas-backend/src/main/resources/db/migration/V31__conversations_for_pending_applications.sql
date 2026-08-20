-- Başvuru alındığında sohbet: mevcut aktif başvurular için konuşma oluştur
INSERT INTO conversations (id, application_id, business_user_id, individual_user_id, status, created_at)
SELECT
    gen_random_uuid(),
    a.id,
    bu.id,
    iu.id,
    'OPEN',
    COALESCE(a.applied_at, NOW())
FROM applications a
JOIN individual_profiles ip ON ip.id = a.individual_id
JOIN users iu ON iu.id = ip.user_id
JOIN business_profiles bp ON bp.id = a.business_id
JOIN users bu ON bu.id = bp.user_id
WHERE a.status NOT IN ('REJECTED', 'WITHDRAWN')
  AND NOT EXISTS (
    SELECT 1 FROM conversations c WHERE c.application_id = a.id
  );
