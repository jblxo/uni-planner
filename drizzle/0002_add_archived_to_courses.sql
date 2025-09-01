-- Add archived flag to courses (boolean stored as integer)
ALTER TABLE courses ADD COLUMN archived integer NOT NULL DEFAULT 0;

