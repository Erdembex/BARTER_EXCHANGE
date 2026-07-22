-- Takas sonucu oluşturulan yeni kuponların bir başvurusu (application) yoktur.
-- Bu nedenle application_id artık NULL olabilir. UNIQUE kısıtı korunur;
-- PostgreSQL birden fazla NULL değeri benzersiz sayar, dolayısıyla sorun olmaz.
ALTER TABLE coupons ALTER COLUMN application_id DROP NOT NULL;
