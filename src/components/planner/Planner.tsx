"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DAYS, Day, buildWeeksFromDates, weekKeyForDate } from "@/lib/weeks";
import { MIN_HOUR, MAX_HOUR, rangesOverlap, timeToMinutes } from "@/lib/time";
import { ScheduleGrid } from "./ScheduleGrid";
import { MultiWeekMatrix } from "./MultiWeekMatrix";
import { colorFromName, defaultHexFromName } from "@/lib/color";
import { useRouter } from "next/navigation";
import { deleteLectureAction, saveLectureAction, setCourseColorAction, saveBulkSessionsAction } from "@/app/actions";

export type Lecture = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  day: Day;
  start: string; // HH:mm
  end: string; // HH:mm
  credits?: number; // per-course credits (counted once per unique course)
  color?: string | null;
};

type Props = {
  initialLectures: Lecture[];
  initialCourses: Array<{ id: string; name: string; credits: number; color: string | null; type?: "mandatory" | "mo" | null }>;
};

export function Planner({ initialLectures, initialCourses }: Props) {
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>(initialLectures);
  const weeksDynamic = useMemo(() => buildWeeksFromDates(lectures.map((l) => (l as any).date ?? (l as any).date)), [lectures]);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  useEffect(() => {
    if (!selectedWeek && weeksDynamic[0]) setSelectedWeek(weeksDynamic[0].key);
  }, [weeksDynamic, selectedWeek]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string>("");

  // Per-course custom colors
  const [courseColors, setCourseColors] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const c of initialCourses) if (c.color) map[c.name] = c.color;
    return map;
  });
  const courseTypes = useMemo(() => {
    const map: Record<string, "mandatory" | "mo" | null | undefined> = {};
    for (const c of initialCourses) map[c.name] = (c as any).type ?? null;
    return map;
  }, [initialCourses]);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState<string>("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:30");
  // weeks removed; sessions now use explicit dates
  const [credits, setCredits] = useState<string>("0");
  const [matrixFilter, setMatrixFilter] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Array<{ date: string; start: string; end: string }>>([
    { date: "", start: "09:00", end: "10:30" },
  ]);
  const [deletingId, setDeletingId] = useState<string>("");

  const selectedWeekLectures = useMemo(
    () => lectures.filter((l: any) => weekKeyForDate((l as any).date) === selectedWeek),
    [lectures, selectedWeek]
  );

  // Global and per-week deduped conflict counts (by course pair)
  const { globalConflictCount, perWeekConflictCount } = useMemo(() => {
    // Group by date for efficient overlap checks
    const byDate = new Map<string, Lecture[]>();
    for (const l of lectures) {
      const arr = byDate.get((l as any).date) || [];
      arr.push(l);
      byDate.set((l as any).date, arr);
    }
    const globalPairs = new Set<string>();
    const perWeekPairs = new Map<string, Set<string>>();

    for (const [date, arrRaw] of byDate) {
      const arr = arrRaw.slice().sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      const week = weekKeyForDate(date);
      const weekSet = perWeekPairs.get(week) || new Set<string>();
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i];
          const b = arr[j];
          if (a.name === b.name) continue; // same course
          const s1 = timeToMinutes(a.start), e1 = timeToMinutes(a.end);
          const s2 = timeToMinutes(b.start), e2 = timeToMinutes(b.end);
          if (!rangesOverlap(s1, e1, s2, e2)) continue;
          const pair = [a.name.trim(), b.name.trim()].sort().join("::");
          globalPairs.add(pair);
          weekSet.add(pair);
        }
      }
      if (weekSet.size) perWeekPairs.set(week, weekSet);
    }
    const perWeekConflictCount: Record<string, number> = {};
    for (const [w, set] of perWeekPairs) perWeekConflictCount[w] = set.size;
    return { globalConflictCount: globalPairs.size, perWeekConflictCount };
  }, [lectures]);

  const uniqueCoursesCount = useMemo(() => new Set(lectures.map((l) => l.name.trim())).size, [lectures]);
  const creditBreakdown = useMemo(() => {
    // Compute credits per course using authoritative course list (includes undated courses)
    // If a course is missing, fall back to lecture-provided credits.
    const lectureMaxByCourse = new Map<string, number>();
    for (const l of lectures) {
      const name = l.name.trim();
      const val = typeof l.credits === "number" ? l.credits : 0;
      lectureMaxByCourse.set(name, Math.max(lectureMaxByCourse.get(name) ?? 0, val));
    }

    let total = 0, mandatory = 0, mo = 0, noCategory = 0;

    for (const c of initialCourses) {
      const name = c.name.trim();
      const credits = (typeof c.credits === "number" ? c.credits : 0) || lectureMaxByCourse.get(name) || 0;
      if (credits <= 0) continue;
      total += credits;
      if (c.type === "mandatory") mandatory += credits;
      else if (c.type === "mo") mo += credits;
      else noCategory += credits;
    }

    return { total, mandatory, mo, noCategory };
  }, [lectures, initialCourses]);

  async function addOrSaveLecture() {
    if (!name.trim()) return;
    if (editingId) {
      const s = timeToMinutes(start);
      const e = timeToMinutes(end);
      if (isNaN(s) || isNaN(e) || e <= s) return alert("End time must be after start time.");
      if (s < MIN_HOUR * 60 || e > MAX_HOUR * 60)
        return alert(`Please choose times between ${MIN_HOUR}:00 and ${MAX_HOUR}:00`);
      if (!date) return alert("Pick a date.");
      startTransition(async () => {
        await saveLectureAction({
          id: editingId ?? undefined,
          name: name.trim(),
          credits: Number(credits) || 0,
          date,
          start,
          end,
        });
        setEditingId(null);
        setStatusMsg("Saved");
        router.refresh();
        setTimeout(() => setStatusMsg(""), 1200);
      });
    } else {
      // Validate all drafts
      for (const d of drafts) {
        const s = timeToMinutes(d.start);
        const e = timeToMinutes(d.end);
        if (isNaN(s) || isNaN(e) || e <= s) return alert("Each session must have end after start.");
        if (s < MIN_HOUR * 60 || e > MAX_HOUR * 60) return alert(`Times must be between ${MIN_HOUR}:00 and ${MAX_HOUR}:00`);
        if (!d.date) return alert("Each session needs a date.");
      }
      startTransition(async () => {
        await saveBulkSessionsAction({
          name: name.trim(),
          credits: Number(credits) || 0,
          sessions: drafts.map((d) => ({ date: d.date, start: d.start, end: d.end })),
        });
        setName("");
        setDrafts([{ date: "", start: "09:00", end: "10:30" }]);
        setStatusMsg("Added");
        router.refresh();
        setTimeout(() => setStatusMsg(""), 1200);
      });
    }
  }

  async function removeLecture(id: string) {
    setDeletingId(id);
    await deleteLectureAction(id);
    setDeletingId("");
    router.refresh();
  }

  function beginEdit(id: string) {
    const l = lectures.find((x) => x.id === id);
    if (!l) return;
    setEditingId(id);
    setName(l.name);
    setDate((l as any).date ?? "");
    setStart(l.start);
    setEnd(l.end);
    setCredits(String(l.credits ?? 0));
  }

  const courseNames = useMemo(
    () => Array.from(new Set(lectures.map((l) => l.name.trim()))).sort(),
    [lectures]
  );
  const effectiveColor = (course: string) => courseColors[course] || colorFromName(course);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Weekend Course Planner</h1>
        <div className="text-sm text-neutral-600 dark:text-neutral-300 flex gap-4">
          <div>
            <span className="font-medium">Courses:</span> {uniqueCoursesCount}
          </div>
          <div>
            <span className="font-medium">Lectures:</span> {lectures.length}
          </div>
          <div className={globalConflictCount ? "text-red-600 font-medium" : undefined}>
            <span className="font-medium">Conflicts:</span> {globalConflictCount}
          </div>
          <div>
            <span className="font-medium">Credits:</span> {creditBreakdown.total}
          </div>
          <div>
            <span className="font-medium">Mandatory:</span> {creditBreakdown.mandatory}
          </div>
          <div>
            <span className="font-medium">MO:</span> {creditBreakdown.mo}
          </div>
          <div>
            <span className="font-medium">No category:</span> {creditBreakdown.noCategory}
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
        <h2 className="text-base font-semibold mb-3">{editingId ? "Edit lecture" : "Add lecture"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Course name</Label>
            <Input id="name" placeholder="Algorithms" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="credits">Credits</Label>
            <Input
              id="credits"
              type="number"
              inputMode="numeric"
              min={0}
              step={0.5}
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
          </div>
          {editingId ? (
            <>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="start">Start</Label>
                <Input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end">End</Label>
                <Input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </>
          ) : (
            <div className="sm:col-span-7">
              <Label>Sessions</Label>
              <div className="mt-2 space-y-3">
                {drafts.map((d, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end rounded border border-neutral-200 dark:border-neutral-800 p-3">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={d.date} onChange={(e) => setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
                    </div>
                    <div>
                      <Label>Start</Label>
                      <Input type="time" value={d.start} onChange={(e) => setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
                    </div>
                    <div>
                      <Label>End</Label>
                      <Input type="time" value={d.end} onChange={(e) => setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
                    </div>
                    <div>
                      <Button variant="secondary" onClick={() => setDrafts((prev) => prev.filter((_, j) => j !== i))}>Remove</Button>
                    </div>
                  </div>
                ))}
                <Button variant="secondary" onClick={() => setDrafts((prev) => [...prev, { date: "", start: "09:00", end: "10:30" }])}>Add session</Button>
              </div>
            </div>
          )}
          <div className="sm:col-span-7 flex gap-2 items-center">
            <Button onClick={addOrSaveLecture} disabled={isPending}>
              {isPending ? (editingId ? "Saving…" : "Adding…") : editingId ? "Save" : "Add"}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={() => { setEditingId(null); setName(""); }} disabled={isPending}>
                Cancel
              </Button>
            )}
            {statusMsg && <div className="text-sm text-green-600 dark:text-green-400">{statusMsg}</div>}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {weeksDynamic.map((w) => (
            <Button
              key={w.id}
              size="sm"
              variant={selectedWeek === w.key ? "default" : "secondary"}
              onClick={() => setSelectedWeek(w.key)}
            >
              <span className="whitespace-nowrap">{w.id}</span>
              <span className="ml-2 text-xs opacity-70 hidden sm:inline-block truncate max-w-[180px]">{w.label}</span>
              {perWeekConflictCount[w.key] ? (
                <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-600 text-white">
                  {perWeekConflictCount[w.key]}
                </span>
              ) : null}
            </Button>
          ))}
        </div>
        <div className="text-sm mt-1">
          <span className="font-medium">Week conflicts:</span>{" "}
          <span className={perWeekConflictCount[selectedWeek] ? "text-red-600 font-medium" : undefined}>
            {perWeekConflictCount[selectedWeek] ?? 0}
          </span>
        </div>
        <ScheduleGrid
          weekKey={selectedWeek}
          lectures={lectures}
          onDelete={removeLecture}
          onEdit={beginEdit}
          getColor={(name) => effectiveColor(name)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Multi‑week matrix</h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-3">
          <div className="text-sm font-medium">Filter courses</div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={matrixFilter.length === 0 ? "default" : "secondary"}
              onClick={() => setMatrixFilter([])}
            >
              All
            </Button>
            {courseNames.map((c) => {
              const active = matrixFilter.includes(c);
              return (
                <Button
                  key={c}
                  size="sm"
                  variant={active ? "default" : "secondary"}
                  onClick={() =>
                    setMatrixFilter((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
                  }
                  style={{ background: active ? effectiveColor(c) : undefined }}
                >
                  {c}
                </Button>
              );
            })}
          </div>

          <div className="text-sm font-medium">Course colors</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseNames.length === 0 && <div className="text-sm text-neutral-500">No courses yet.</div>}
            {courseNames.map((c) => (
              <div key={c} className="flex items-center justify-between gap-3 rounded border border-neutral-200 dark:border-neutral-800 p-2">
                <div className="truncate font-medium" title={c}>{c}</div>
                <input
                  type="color"
                  className="h-8 w-12 cursor-pointer bg-transparent border-0"
                  value={courseColors[c] || defaultHexFromName(c)}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setCourseColors((prev) => ({ ...prev, [c]: value }));
                    await setCourseColorAction(c, value);
                    router.refresh();
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <MultiWeekMatrix lectures={lectures} getColor={effectiveColor} filterCourses={matrixFilter} />
      </section>

      <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
        <h2 className="text-base font-semibold mb-3">All lectures</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-2 pr-2">Course</th>
                <th className="py-2 pr-2">Day</th>
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Time</th>
                <th className="py-2 pr-2">Credits</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lectures.map((l) => (
                <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="py-2 pr-2 max-w-[240px] truncate" title={l.name}>{l.name}</td>
                  <td className="py-2 pr-2">{l.day}</td>
                  <td className="py-2 pr-2">{(l as any).date ?? ''}</td>
                  <td className="py-2 pr-2">{l.start}–{l.end}</td>
                  <td className="py-2 pr-2">{l.credits ?? 0}</td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => beginEdit(l.id)} disabled={deletingId === l.id}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeLecture(l.id)} disabled={deletingId === l.id}>
                        {deletingId === l.id ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {lectures.length === 0 && (
                <tr>
                  <td className="py-4 text-neutral-500" colSpan={5}>
                    No lectures yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
