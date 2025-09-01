import { NextResponse } from "next/server";
import { getAllRaw } from "@/db/queries";

export const runtime = "nodejs";

export async function GET() {
  const data = await getAllRaw();
  return NextResponse.json(data, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

