import { NextResponse } from "next/server";
import { getFlatRows } from "@/db/queries";

export const runtime = "nodejs";

export async function GET() {
  const rows = await getFlatRows();
  const headers = ["course_name", "credits", "color", "date", "start", "end"];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers.join(",")]
    .concat(rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(",")))
    .join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=planner_export.csv",
      "Cache-Control": "no-store",
    },
  });
}
