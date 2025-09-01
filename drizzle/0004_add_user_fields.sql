-- Add per-user ownership fields for multi-tenant data
ALTER TABLE courses ADD COLUMN user_id text;
ALTER TABLE sessions ADD COLUMN user_id text;

-- NOTE: Existing unique constraint on courses.name remains. In a follow-up
-- migration we can move to a composite unique (user_id, name) if needed.

