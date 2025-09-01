-- Rebuild courses table to enforce per-user uniqueness on (user_id, name)
PRAGMA foreign_keys=off;

CREATE TABLE IF NOT EXISTS "__courses_new" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "credits" real NOT NULL DEFAULT 0,
  "color" text,
  "archived" integer NOT NULL DEFAULT 0,
  "type" text,
  "user_id" text
);

INSERT INTO "__courses_new" (id, name, credits, color, archived, type, user_id)
  SELECT id, name, credits, color, archived, type, user_id FROM courses;

DROP TABLE courses;
ALTER TABLE "__courses_new" RENAME TO courses;

-- Add unique and helpful indexes
CREATE UNIQUE INDEX IF NOT EXISTS courses_user_name_unique ON courses (user_id, name);
CREATE INDEX IF NOT EXISTS courses_user_idx ON courses (user_id);

PRAGMA foreign_keys=on;

