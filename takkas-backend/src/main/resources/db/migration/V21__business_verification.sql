ALTER TABLE business_profiles
    ADD COLUMN verification_status VARCHAR(32) NOT NULL DEFAULT 'NONE',
    ADD COLUMN verification_document_url TEXT,
    ADD COLUMN verification_document_name VARCHAR(255);

UPDATE business_profiles
SET verification_status = 'VERIFIED'
WHERE verified = TRUE;
