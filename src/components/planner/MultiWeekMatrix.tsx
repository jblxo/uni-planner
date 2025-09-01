"use client";

import { DAYS, Day, buildWeeksFromDates, weekKeyForDate } from "@/lib/weeks";

type LocalLecture = { id: string; name: string; date: string; day: Day; start: string; end: string; credits?: number; color?: string | null };

type Props = {
  lectures: LocalLecture[];
  getColor: (name: string) => string;
  filterCourses?: string[]; // if set and non-empty, only show these course names
};

export function MultiWeekMatrix({ lectures, getColor, filterCourses }: Props) {
  const weeks = buildWeeksFromDates(lectures.map((l) => l.date));
  const byWeek = new Map<string, Record<Day, LocalLecture[]>>();
  for (const w of weeks) byWeek.set(w.key, { Fri: [], Sat: [], Sun: [] });
  for (const l of lectures) {
    if (filterCourses && filterCourses.length && !filterCourses.includes(l.name)) continue;
    const key = weekKeyForDate(l.date);
    if (!byWeek.has(key)) continue;
    const slot = byWeek.get(key)!;
    slot[l.day].push(l);
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="grid grid-cols-[120px_repeat(3,1fr)] bg-neutral-50 dark:bg-neutral-900/40 text-sm">
        <div className="px-3 py-2 font-medium border-r border-neutral-200 dark:border-neutral-800 min-w-0">Week</div>
        {DAYS.map((d) => (
          <div key={d} className="px-3 py-2 font-medium border-r last:border-r-0 border-neutral-200 dark:border-neutral-800 min-w-0">
            {d}
          </div>
        ))}
      </div>
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {weeks.map((w) => {
          const row = byWeek.get(w.key)!;
          return (
            <div key={w.id} className="grid grid-cols-[120px_repeat(3,1fr)]">
              <div className="px-3 py-2 text-sm border-r border-neutral-200 dark:border-neutral-800 min-w-0 break-words overflow-hidden">
                <div className="font-medium">{w.id}</div>
                <div className="opacity-70 text-xs">{w.label}</div>
              </div>
              {(DAYS as readonly Day[]).map((d) => (
                <div key={d} className="px-2 py-2 flex flex-wrap gap-2 border-r last:border-r-0 border-neutral-200 dark:border-neutral-800 min-h-[48px] min-w-0">
                  {row[d]
                    .slice()
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((l, i) => (
                      <span
                        key={l.id + i}
                        className="inline-flex max-w-full items-center gap-1 rounded px-2 py-1 text-[11px] text-white overflow-hidden"
                        style={{ background: getColor(l.name) }}
                        title={`${l.name} ${l.start}–${l.end}`}
                      >
                        <span className="font-semibold truncate max-w-[140px]">{l.name}</span>
                        <span className="opacity-90 whitespace-nowrap">{l.start}–{l.end}</span>
                      </span>
                    ))}
                  {row[d].length === 0 && (
                    <span className="text-xs text-neutral-500">—</span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
