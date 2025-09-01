"use client";

import { DAYS, Day, weekKeyForDate } from "@/lib/weeks";
import { MAX_HOUR, MIN_HOUR, clamp, timeToMinutes } from "@/lib/time";
import { Button } from "@/components/ui/button";

type LocalLecture = { id: string; name: string; date: string; day: Day; start: string; end: string; credits?: number; color?: string | null };

type Props = {
  weekKey: string; // computed key for the selected week
  lectures: LocalLecture[];
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  getColor: (name: string) => string;
};

export function ScheduleGrid({ weekKey, lectures, onDelete, onEdit, getColor }: Props) {
  const filtered = lectures.filter((l) => weekKeyForDate(l.date) === weekKey);

  const hours = [] as number[];
  for (let h = MIN_HOUR; h <= MAX_HOUR; h++) hours.push(h);

  const gridHeight = 48 * (MAX_HOUR - MIN_HOUR);

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header with left gutter for time labels */}
      <div className="grid grid-cols-[48px_repeat(3,1fr)] bg-neutral-50 dark:bg-neutral-900/40 text-sm">
        <div className="px-2 py-2 border-r border-neutral-200 dark:border-neutral-800" />
        {DAYS.map((d) => (
          <div key={d} className="px-3 py-2 font-medium border-r last:border-r-0 border-neutral-200 dark:border-neutral-800">
            {d}
          </div>
        ))}
      </div>
      <div className="relative" style={{ height: gridHeight }}>
        {/* Time labels gutter */}
        <div
          className="absolute left-0 top-0 w-[48px] h-full text-[11px] text-neutral-500 select-none"
          style={{ display: "grid", gridTemplateRows: `repeat(${MAX_HOUR - MIN_HOUR}, 48px)` }}
        >
          {hours.slice(0, -1).map((h) => (
            <div key={h} className="border-t border-neutral-100 dark:border-neutral-900">
              <div className="-mt-3 ml-1">{String(h).padStart(2, "0")}:00</div>
            </div>
          ))}
        </div>

        {/* Columns with lectures (shifted right by gutter) */}
        <div className="absolute top-0 right-0 z-10" style={{ left: 48 }}>
          <div className="grid grid-cols-3 divide-x divide-neutral-200 dark:divide-neutral-800" style={{ height: gridHeight }}>
            {(DAYS as readonly Day[]).map((d) => (
              <DayColumn
                key={d}
                day={d}
                items={filtered.filter((l) => l.day === d)}
                getColor={getColor}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>

        {/* Hour grid lines across the columns only */}
        <div
          className="pointer-events-none absolute top-0 right-0 z-0"
          style={{ left: 48, display: "grid", gridTemplateRows: `repeat(${MAX_HOUR - MIN_HOUR}, 48px)`, height: gridHeight }}
        >
          {hours.slice(0, -1).map((h) => (
            <div key={h} className="border-t border-neutral-100 dark:border-neutral-900" />
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-neutral-500 px-3 py-2 border-t border-neutral-200 dark:border-neutral-800">
          No lectures scheduled in this week. Tip: pick a week with sessions.
        </div>
      )}
    </div>
  );
}

function DayColumn({ items, onDelete, onEdit, getColor }: { day: Day; items: LocalLecture[]; onDelete: (id: string) => void; onEdit?: (id: string) => void; getColor: (name: string) => string }) {
  // Compute layout with overlap handling: overlapping items are placed side-by-side
  type Positioned = { item: LocalLecture; top: number; height: number; leftPct: number; widthPct: number };

  const totalMinutes = (MAX_HOUR - MIN_HOUR) * 60;

  // Sort by start time for deterministic grouping
  const sorted = [...items].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  // Build clusters of transitive overlaps
  const clusters: LocalLecture[][] = [];
  let current: LocalLecture[] = [];
  let currentEnd = -1;
  for (const it of sorted) {
    const s = timeToMinutes(it.start);
    const e = timeToMinutes(it.end);
    if (current.length === 0) {
      current.push(it);
      currentEnd = e;
    } else if (s < currentEnd) {
      // still overlapping the running cluster
      current.push(it);
      currentEnd = Math.max(currentEnd, e);
    } else {
      clusters.push(current);
      current = [it];
      currentEnd = e;
    }
  }
  if (current.length) clusters.push(current);

  const positioned: Positioned[] = [];

  for (const cluster of clusters) {
    // Greedy column assignment
    const colEnds: number[] = []; // end minute per column
    const colOf: Map<string, number> = new Map();

    for (const it of cluster) {
      const s = timeToMinutes(it.start);
      const e = timeToMinutes(it.end);
      let placed = false;
      for (let i = 0; i < colEnds.length; i++) {
        if (colEnds[i] <= s) {
          colEnds[i] = e;
          colOf.set(it.id, i);
          placed = true;
          break;
        }
      }
      if (!placed) {
        colEnds.push(e);
        colOf.set(it.id, colEnds.length - 1);
      }
    }

    const cols = colEnds.length;
    const baseWidth = 100 / cols;

    for (const it of cluster) {
      const s = timeToMinutes(it.start);
      const e = timeToMinutes(it.end);
      // Vertical positioning
      const top = ((clamp(s, MIN_HOUR * 60, MAX_HOUR * 60) - MIN_HOUR * 60) / totalMinutes) * 100;
      const height = ((clamp(e, MIN_HOUR * 60, MAX_HOUR * 60) - clamp(s, MIN_HOUR * 60, MAX_HOUR * 60)) / totalMinutes) * 100;

      const col = colOf.get(it.id) ?? 0;
      const leftPct = col * baseWidth;
      const widthPct = baseWidth;

      positioned.push({ item: it, top, height, leftPct, widthPct });
    }
  }

  return (
    <div className="relative bg-white dark:bg-neutral-950" style={{ height: 48 * (MAX_HOUR - MIN_HOUR) }}>
      {positioned.map(({ item, top, height, leftPct, widthPct }) => (
        <LectureBlock
          key={item.id}
          item={item}
          onDelete={onDelete}
          onEdit={onEdit}
          color={getColor(item.name)}
          position={{ topPct: top, heightPct: height, leftPct, widthPct }}
        />
      ))}
    </div>
  );
}

function LectureBlock({ item, color, onDelete, onEdit, position }: { item: LocalLecture; color: string; onDelete: (id: string) => void; onEdit?: (id: string) => void; position: { topPct: number; heightPct: number; leftPct: number; widthPct: number } }) {
  const { topPct, heightPct, leftPct, widthPct } = position;

  // Small horizontal padding per cell using CSS calc to avoid overlaps visually
  const left = `calc(${leftPct}% + 2px)`;
  const width = `calc(${widthPct}% - 4px)`;

  return (
    <div
      className="absolute rounded-md px-2 py-1 text-xs text-white shadow-md overflow-hidden border border-black/10"
      style={{ top: `${topPct}%`, height: `${heightPct}%`, left, width, background: color }}
      title={`${item.name} ${item.start}–${item.end}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="font-semibold truncate pr-1 min-w-0">{item.name}</div>
        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            className="text-white/90 hover:text-white hover:bg-white/20 h-6 px-2"
            onClick={() => onEdit?.(item.id)}
            title="Edit"
          >
            Edit
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-white/90 hover:text-white hover:bg-white/20 h-6 px-2"
          onClick={() => onDelete(item.id)}
          title="Delete"
        >
          ×
        </Button>
      </div>
      <div className="opacity-90 mt-1 whitespace-nowrap">{item.start}–{item.end}</div>
    </div>
  );
}
