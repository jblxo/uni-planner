"use server";

import { revalidatePath } from "next/cache";
import {
  deleteSessionById,
  saveSession,
  setCourseColorByName,
  createSessionsForCourse,
  updateCourse,
  mergeCourses,
  replaceAll,
  createCourse,
  setCourseArchived,
} from "@/db/queries";
import { getUserId } from "@/lib/auth";

export async function saveLectureAction(form: {
  id?: string;
  name: string;
  credits: number;
  color?: string | null;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");
  await saveSession({ id: form.id, courseName: form.name, credits: form.credits, color: form.color, date: form.date, start: form.start, end: form.end, userId });
  revalidatePath("/");
  revalidatePath("/planner");
}

export async function deleteLectureAction(id: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");
  await deleteSessionById(id, userId);
  revalidatePath("/");
  revalidatePath("/planner");
}

export async function setCourseColorAction(name: string, color: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");
  await setCourseColorByName(name, color, userId);
  revalidatePath("/");
  revalidatePath("/planner");
}

export async function saveBulkSessionsAction(form: {
  name: string;
  credits: number;
  color?: string | null;
  sessions: Array<{ date: string; start: string; end: string }>;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");
  await createSessionsForCourse({ ...form, userId });
  revalidatePath("/");
  revalidatePath("/planner");
}

export async function updateCourseAction(id: string, data: { name?: string; credits?: number; color?: string | null; type?: "mandatory" | "mo" | null }) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");
  await updateCourse(id, data, userId);
  revalidatePath("/courses");
  revalidatePath("/planner");
}

export async function mergeCoursesAction(fromId: string, toId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");
  await mergeCourses(fromId, toId, userId);
  revalidatePath("/courses");
  revalidatePath("/planner");
}

export async function createCourseAction(form: { name: string; credits: number; color?: string | null; type?: "mandatory" | "mo" | null }) {
  if (!form.name.trim()) return;
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");
  await createCourse({ name: form.name.trim(), credits: form.credits || 0, color: form.color, type: form.type, userId });
  revalidatePath("/courses");
  revalidatePath("/planner");
}

export async function setCourseArchivedAction(id: string, archived: boolean) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");
  await setCourseArchived(id, archived, userId);
  revalidatePath("/archive");
  revalidatePath("/courses");
  revalidatePath("/planner");
  revalidatePath("/eliminator");
}

export async function importDataAction(json: string) {
  const data = JSON.parse(json);
  await replaceAll(data);
  revalidatePath("/data");
  revalidatePath("/planner");
  revalidatePath("/");
}

export async function importCsvAction(csv: string) {
  // Expected headers: course_name, credits, color, date, start, end
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length === 0) return;
  const parsed = parseCsv(lines.join("\n"));
  // Group by course
  const byCourse = new Map<string, { credits: number; color?: string | null; sessions: Array<{ date: string; start: string; end: string }> }>();
  for (const row of parsed) {
    const name = (
      row["course_name"] || row["Course"] || row["Name"] || row["Kurz"] || row["Název"] || row["Nazev"] || ""
    )
      .toString()
      .trim();
    if (!name) continue;
    const credits = Number(row["credits"] ?? row["Credits"] ?? row["Kredity"] ?? 0) || 0;
    const color = (row["color"] ?? row["Color"] ?? "") as string;
    const dateRaw = String(row["date"] ?? row["Date"] ?? row["Datum"] ?? "");
    const date = toISODate(dateRaw);
    let start = (row["start"] ?? row["Start"] ?? row["Začátek"] ?? row["Zacatek"] ?? "").toString();
    let end = (row["end"] ?? row["End"] ?? row["Konec"] ?? "").toString();
    const timeRange = (row["time"] ?? row["Time"] ?? row["Čas"] ?? row["Cas"] ?? "").toString();
    if ((!start || !end) && timeRange) {
      const pr = parseTimeRange(timeRange);
      if (pr) {
        start = pr.start;
        end = pr.end;
      }
    }
    start = toHM(start);
    end = toHM(end);
    if (!date || !start || !end) continue;
    const entry = byCourse.get(name) || { credits: 0, color: undefined, sessions: [] };
    entry.credits = credits || entry.credits;
    if (color) entry.color = color;
    entry.sessions.push({ date, start, end });
    byCourse.set(name, entry);
  }
  for (const [name, info] of byCourse) {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");
    await createSessionsForCourse({ name, credits: info.credits || 0, color: info.color, sessions: info.sessions, userId });
  }
  revalidatePath("/data");
  revalidatePath("/planner");
}

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let i = 0, field = '', row: string[] = [], inQuotes = false;
  while (i < text.length) {
    const ch = text[i++];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field=''; }
      else if (ch === '\r') { /* ignore */ }
      else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? ''; });
    return obj;
  });
}

function toISODate(s: string): string {
  const t = s.trim();
  if (!t) return "";
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  // dd.mm.yyyy or dd. mm. yyyy
  const m = t.match(/^(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  // Try Date parse and format
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return "";
}

function toHM(s: string): string {
  const m = s.trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

function parseTimeRange(s: string): { start: string; end: string } | null {
  const m = s.trim().match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!m) return null;
  return { start: toHM(m[1]), end: toHM(m[2]) };
}
