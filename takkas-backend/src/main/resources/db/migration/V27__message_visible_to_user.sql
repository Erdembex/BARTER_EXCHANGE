-- SYSTEM tipi mesajlar için: null ise herkese görünür, dolu ise yalnızca o kullanıcıya görünür.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS visible_to_user_id UUID;

CREATE INDEX IF NOT EXISTS messages_visible_to_user_idx ON messages (visible_to_user_id);
