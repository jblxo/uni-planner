import { db } from "./client";
import { courses, sessions } from "./schema";
import { and, eq, isNull, or } from "drizzle-orm";

export async function getPlannerData(userId?: string | null) {
  // Only active (non-archived) courses for the current user
  const whereCourses = userId
    ? and(eq(courses.archived, false), eq(courses.userId, userId))
    : eq(courses.archived, false);
  const allCourses = await db.select().from(courses).where(whereCourses as any);
  const activeIds = new Set(allCourses.map((c) => c.id));
  const allSessions = (await db.select().from(sessions)).filter((s) => activeIds.has(s.courseId));

  const courseById = new Map(allCourses.map((c) => [c.id, c] as const));
  const lectures = allSessions.map((s) => {
    const c = courseById.get(s.courseId)!;
    return {
      id: s.id,
      name: c?.name ?? "",
      date: s.date,
      day: dayFromISO(s.date) as "Fri" | "Sat" | "Sun",
      start: s.start,
      end: s.end,
      credits: c?.credits ?? 0,
      color: c?.color ?? null,
    } as any;
  });

  return { courses: allCourses, lectures };
}

function dayFromISO(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0 Sun
  return day === 5 ? "Fri" : day === 6 ? "Sat" : "Sun";
}

export async function upsertCourseByName(input: { name: string; credits: number; color?: string | null; type?: "mandatory" | "mo" | null; userId?: string | null }) {
  const existing = await db.query.courses.findFirst({ where: (c, { and, eq }) => and(eq(c.name, input.name), eq(c.userId, input.userId ?? "")) });
  if (existing) {
    await db
      .update(courses)
      .set({ credits: input.credits, color: input.color ?? existing.color, type: input.type ?? existing.type })
      .where(eq(courses.id, existing.id));
    return existing.id;
  }
  const id = crypto.randomUUID();
  await db
    .insert(courses)
    .values({ id, name: input.name, credits: input.credits, color: input.color ?? null, archived: false, type: input.type ?? null, userId: input.userId ?? null });
  return id;
}

export async function createCourse(input: { name: string; credits: number; color?: string | null; type?: "mandatory" | "mo" | null; userId?: string | null }) {
  // Reuse upsert semantics so users can’t accidentally double-create
  return upsertCourseByName(input);
}

export async function saveSession(input: {
  id?: string;
  courseName: string;
  credits: number;
  color?: string | null;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  userId?: string | null;
}) {
  const courseId = await upsertCourseByName({ name: input.courseName, credits: input.credits, color: input.color, userId: input.userId });
  const id = input.id ?? crypto.randomUUID();
  if (!input.id) {
    await db.insert(sessions).values({ id, courseId, date: input.date, start: input.start, end: input.end, userId: input.userId ?? null });
  } else {
    await db
      .update(sessions)
      .set({ courseId, date: input.date, start: input.start, end: input.end, userId: input.userId ?? null })
      .where(eq(sessions.id, id));
  }
  return id;
}

export async function deleteSessionById(id: string, userId?: string | null) {
  if (userId) {
    await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, userId)) as any);
  } else {
    // Fallback (should not happen due to middleware)
    await db.delete(sessions).where(eq(sessions.id, id));
  }
}

export async function setCourseColorByName(name: string, color: string, userId?: string | null) {
  const existing = await db.query.courses.findFirst({ where: (c, { and, eq }) => and(eq(c.name, name), eq(c.userId, userId ?? "")) });
  if (existing) {
    await db.update(courses).set({ color }).where(eq(courses.id, existing.id));
  }
}

// Bulk helpers
export async function createSessionsForCourse(input: {
  name: string;
  credits: number;
  color?: string | null;
  sessions: Array<{ date: string; start: string; end: string }>;
  userId?: string | null;
}) {
  const courseId = await upsertCourseByName({ name: input.name, credits: input.credits, color: input.color, userId: input.userId });
  for (const s of input.sessions) {
    const id = crypto.randomUUID();
    await db.insert(sessions).values({ id, courseId, date: s.date, start: s.start, end: s.end, userId: input.userId ?? null });
  }
}

export async function updateCourse(id: string, data: { name?: string; credits?: number; color?: string | null; type?: "mandatory" | "mo" | null }, userId?: string | null) {
  if (userId) {
    await db.update(courses).set(data).where(and(eq(courses.id, id), eq(courses.userId, userId)) as any);
  } else {
    await db.update(courses).set(data).where(eq(courses.id, id));
  }
}

export async function mergeCourses(fromId: string, toId: string, userId?: string | null) {
  if (fromId === toId) return;
  if (userId) {
    const from = await db.query.courses.findFirst({ where: (c, { eq }) => eq(c.id, fromId) });
    const to = await db.query.courses.findFirst({ where: (c, { eq }) => eq(c.id, toId) });
    if (!from || !to || from.userId !== userId || to.userId !== userId) return;
    await db.update(sessions).set({ courseId: toId }).where(and(eq(sessions.courseId, fromId), eq(sessions.userId, userId)) as any);
    await db.delete(courses).where(and(eq(courses.id, fromId), eq(courses.userId, userId)) as any);
  } else {
    await db.update(sessions).set({ courseId: toId }).where(eq(sessions.courseId, fromId));
    await db.delete(courses).where(eq(courses.id, fromId));
  }
}

export async function getCoursesWithCounts(userId?: string | null) {
  const whereCourses = userId ? and(eq(courses.archived, false), eq(courses.userId, userId)) : eq(courses.archived, false);
  const allCourses = await db.select().from(courses).where(whereCourses as any);
  const allSessions = await db.select().from(sessions);
  const counts = new Map<string, number>();
  for (const s of allSessions) counts.set(s.courseId, (counts.get(s.courseId) ?? 0) + 1);
  return allCourses.map((c) => ({ ...c, sessionCount: counts.get(c.id) ?? 0 }));
}

export async function getArchivedCoursesWithCounts(userId?: string | null) {
  const whereCourses = userId ? and(eq(courses.archived, true), eq(courses.userId, userId)) : eq(courses.archived, true);
  const archivedCourses = await db.select().from(courses).where(whereCourses as any);
  const allSessions = await db.select().from(sessions);
  const counts = new Map<string, number>();
  for (const s of allSessions) counts.set(s.courseId, (counts.get(s.courseId) ?? 0) + 1);
  return archivedCourses.map((c) => ({ ...c, sessionCount: counts.get(c.id) ?? 0 }));
}

export async function getAllRaw() {
  const allCourses = await db.select().from(courses);
  const allSessions = await db.select().from(sessions);
  return { courses: allCourses, sessions: allSessions };
}

export async function replaceAll(data: { courses: any[]; sessions: any[]; sessionWeeks: any[] }) {
  // Simple replace-all import
  await db.delete(sessions);
  await db.delete(courses);
  if (data.courses?.length) await db.insert(courses).values(data.courses as any);
  if (data.sessions?.length) await db.insert(sessions).values(data.sessions as any);
}

export async function getFlatRows() {
  // Returns flattened session rows for CSV export
  const cs = await db.select().from(courses);
  const ss = await db.select().from(sessions);
  const byId = new Map(cs.map((c) => [c.id, c] as const));
  return ss.map((s) => {
    const c = byId.get(s.courseId)!;
    return {
      course_name: c?.name ?? "",
      credits: c?.credits ?? 0,
      color: c?.color ?? null,
      date: s.date,
      start: s.start,
      end: s.end,
    };
  });
}

export async function setCourseArchived(id: string, archived: boolean, userId?: string | null) {
  if (userId) {
    await db.update(courses).set({ archived }).where(and(eq(courses.id, id), eq(courses.userId, userId)) as any);
  } else {
    await db.update(courses).set({ archived }).where(eq(courses.id, id));
  }
}

export async function getConflictsOrdered(userId?: string | null) {
  // Build conflicts among active courses only, group by course pair,
  // and order by earliest conflicting date/time first
  const whereCourses = userId
    ? and(eq(courses.archived, false), eq(courses.userId, userId))
    : eq(courses.archived, false);
  const activeCourses = await db.select().from(courses).where(whereCourses as any);
  const activeIds = new Set(activeCourses.map((c) => c.id));
  const sessionsAll = (await db.select().from(sessions)).filter((s) => activeIds.has(s.courseId));
  const byCourse = new Map(activeCourses.map((c) => [c.id, c] as const));

  // Sort by date and start time
  const sorted = sessionsAll
    .slice()
    .sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)));

  const conflictsRaw: Array<{
    date: string;
    start: string;
    end: string;
    a: { courseId: string; courseName: string; sessionId: string };
    b: { courseId: string; courseName: string; sessionId: string };
  }> = [];

  // Check overlaps per date (Fri/Sat/Sun constraint isn’t necessary if date matches)
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const s1 = sorted[i];
      const s2 = sorted[j];
      if (s1.date !== s2.date) break; // later dates only
      if (s1.courseId === s2.courseId) continue;
      // Simple time overlap check using string comparison works as HH:mm
      const overlap = s1.start < s2.end && s2.start < s1.end;
      if (overlap) {
        conflictsRaw.push({
          date: s1.date,
          start: s1.start < s2.start ? s1.start : s2.start,
          end: s1.end > s2.end ? s1.end : s2.end,
          a: { courseId: s1.courseId, courseName: byCourse.get(s1.courseId)?.name || "", sessionId: s1.id },
          b: { courseId: s2.courseId, courseName: byCourse.get(s2.courseId)?.name || "", sessionId: s2.id },
        });
      }
    }
  }

  // Deduplicate by course pair, keep the earliest conflict
  const earliestByPair = new Map<string, typeof conflictsRaw[number]>();
  for (const c of conflictsRaw) {
    const k = [c.a.courseId, c.b.courseId].sort().join("::");
    const cur = earliestByPair.get(k);
    if (!cur) {
      earliestByPair.set(k, c);
    } else {
      const curKey = cur.date + "T" + cur.start;
      const newKey = c.date + "T" + c.start;
      if (newKey < curKey) earliestByPair.set(k, c);
    }
  }

  return Array.from(earliestByPair.values()).sort((a, b) =>
    a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)
  );
}

// Adopt legacy rows (with NULL user_id) to the first user who signs in.
// If the user already has any courses, we skip adoption to avoid collisions.
export async function adoptLegacyDataForUser(userId: string) {
  if (!userId) return;
  const existing = await db.query.courses.findFirst({ where: (c, { eq }) => eq(c.userId, userId) });
  if (existing) return;
  // Attach all legacy rows to this user
  await db.update(courses).set({ userId }).where(isNull(courses.userId));
  await db.update(sessions).set({ userId }).where(isNull(sessions.userId));
}
