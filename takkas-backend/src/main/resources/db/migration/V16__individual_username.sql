ALTER TABLE individual_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(30);

UPDATE individual_profiles
SET username = 'user_' || SUBSTRING(REPLACE(id::text, '-', ''), 1, 12)
WHERE username IS NULL OR TRIM(username) = '';

ALTER TABLE individual_profiles ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS individual_profiles_username_lower_idx
    ON individual_profiles (LOWER(username));
