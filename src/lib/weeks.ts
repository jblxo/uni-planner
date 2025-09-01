export type Week = {
  id: string; // e.g., W01, W02 (sorted by date)
  key: string; // ISO of Friday start (YYYY-MM-DD)
  label: string; // formatted date range 'dd. mm. yyyy–dd. mm. yyyy'
  start: string; // ISO Friday
  end: string; // ISO Sunday
};

export const DAYS = ["Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}. ${mm}. ${yyyy}`;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekKeyForDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const dow = d.getDay(); // Sun=0, Mon=1, ..., Fri=5, Sat=6
  let deltaToFriday = 0;
  if (dow === 5) deltaToFriday = 0;
  else if (dow === 6) deltaToFriday = -1;
  else if (dow === 0) deltaToFriday = -2;
  else {
    // If not Fri-Sun, snap to that weekend's Friday: use previous Friday
    deltaToFriday = ((5 - dow + 7) % 7) - 7;
  }
  const friday = addDays(d, deltaToFriday);
  const iso = friday.toISOString().slice(0, 10);
  return iso; // key
}

export function buildWeeksFromDates(dates: string[]): Week[] {
  const map = new Map<string, { start: Date; end: Date }>();
  for (const iso of dates) {
    const key = weekKeyForDate(iso);
    const start = new Date(key + "T00:00:00");
    const end = addDays(start, 2);
    map.set(key, { start, end });
  }
  const sorted = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, { start, end }], idx) => ({
      id: `W${String(idx + 1).padStart(2, "0")}`,
      key,
      label: `${formatDate(start)}–${formatDate(end)}`,
      start: key,
      end: end.toISOString().slice(0, 10),
    }));
  return sorted;
}
