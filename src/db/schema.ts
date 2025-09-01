import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    credits: real("credits").notNull().default(0),
    color: text("color"), // hex color
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    type: text("type"), // 'mandatory' | 'mo' | null
    userId: text("user_id"),
  },
  (t) => ({
    userNameUnique: uniqueIndex("courses_user_name_unique").on(t.userId, t.name),
    userIdx: index("courses_user_idx").on(t.userId),
  })
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").notNull().references(() => courses.id),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    start: text("start").notNull(), // 'HH:mm'
    end: text("end").notNull(),
    userId: text("user_id"),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
  })
);

export type Course = typeof courses.$inferSelect;
export type Session = typeof sessions.$inferSelect;
// No sessionWeeks table in the new model
