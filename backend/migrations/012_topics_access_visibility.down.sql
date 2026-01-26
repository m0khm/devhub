ALTER TABLE topics
  DROP COLUMN IF EXISTS notifications_muted,
  DROP COLUMN IF EXISTS visibility,
  DROP COLUMN IF EXISTS access_level;
