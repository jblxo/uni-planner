"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCourseAction, mergeCoursesAction, createCourseAction } from "@/app/actions";

type Row = { id: string; name: string; credits: number; color: string | null; sessionCount: number; type: "mandatory" | "mo" | null };

export function CourseManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [mergeFrom, setMergeFrom] = useState<string>("");
  const [mergeTo, setMergeTo] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newCredits, setNewCredits] = useState("0");
  const [newColor, setNewColor] = useState<string>("#888888");
  const [newType, setNewType] = useState<"mandatory" | "mo" | "" | null>("");
  const [savingId, setSavingId] = useState<string>("");
  const [creating, startCreating] = useTransition();
  const [merging, startMerging] = useTransition();

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <h1 className="text-2xl font-semibold">Courses</h1>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-2 px-2 text-left">Name</th>
              <th className="py-2 px-2 text-left">Credits</th>
              <th className="py-2 px-2 text-left">Color</th>
              <th className="py-2 px-2 text-left">Type</th>
              <th className="py-2 px-2 text-left">Sessions</th>
              <th className="py-2 px-2 text-left">Save</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-2 py-2">
                  <Input
                    value={r.name}
                    onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                  />
                </td>
                <td className="px-2 py-2 w-32">
                  <Input
                    type="number"
                    step={0.5}
                    value={r.credits}
                    onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, credits: Number(e.target.value) } : x)))}
                  />
                </td>
                <td className="px-2 py-2 w-28">
                  <input
                    type="color"
                    className="h-9 w-12 cursor-pointer bg-transparent border-0"
                    value={r.color ?? "#888888"}
                    onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, color: e.target.value } : x)))}
                  />
                </td>
                <td className="px-2 py-2 w-40">
                  <select
                    className="border rounded px-2 py-2 bg-transparent w-full"
                    value={r.type ?? ""}
                    onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, type: (e.target.value || null) as any } : x)))}
                  >
                    <option value="">—</option>
                    <option value="mandatory">Mandatory</option>
                    <option value="mo">Mandatory optional</option>
                  </select>
                </td>
                <td className="px-2 py-2 w-24">{r.sessionCount}</td>
                <td className="px-2 py-2 w-40">
                  <Button
                    size="sm"
                    disabled={savingId === r.id}
                    onClick={async () => {
                      setSavingId(r.id);
                      await updateCourseAction(r.id, { name: r.name.trim(), credits: r.credits, color: r.color ?? undefined, type: r.type ?? null });
                      setSavingId("");
                    }}
                  >
                    {savingId === r.id ? "Saving…" : "Save"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-3">
        <h2 className="text-base font-semibold">Add course (no dates)</h2>
        <div className="grid sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2">
            <div className="text-sm font-medium">Name</div>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Course name" />
          </div>
          <div>
            <div className="text-sm font-medium">Credits</div>
            <Input type="number" min={0} step={0.5} value={newCredits} onChange={(e) => setNewCredits(e.target.value)} />
          </div>
          <div>
            <div className="text-sm font-medium">Color</div>
            <input type="color" className="h-9 w-12 cursor-pointer bg-transparent border-0" value={newColor}
              onChange={(e) => setNewColor(e.target.value)} />
          </div>
          <div>
            <div className="text-sm font-medium">Type</div>
            <select className="border rounded px-2 py-2 bg-transparent w-full" value={newType ?? ""} onChange={(e) => setNewType((e.target.value || null) as any)}>
              <option value="">—</option>
              <option value="mandatory">Mandatory</option>
              <option value="mo">Mandatory optional</option>
            </select>
          </div>
          <div>
            <Button
              onClick={() => startCreating(async () => {
                await createCourseAction({ name: newName, credits: Number(newCredits) || 0, color: newColor, type: (newType || undefined) as any });
                setNewName("");
              })}
              disabled={!newName.trim() || creating}
            >
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-3">
        <h2 className="text-base font-semibold">Merge / Rename</h2>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">Move all sessions from one course into another, then delete the source.</div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className="border rounded px-2 py-2 bg-transparent" value={mergeFrom} onChange={(e) => setMergeFrom(e.target.value)}>
            <option value="">From…</option>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <span>→</span>
          <select className="border rounded px-2 py-2 bg-transparent" value={mergeTo} onChange={(e) => setMergeTo(e.target.value)}>
            <option value="">To…</option>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <Button
            variant="destructive"
            disabled={!mergeFrom || !mergeTo || mergeFrom === mergeTo || merging}
            onClick={() => startMerging(async () => { await mergeCoursesAction(mergeFrom, mergeTo); })}
          >
            {merging ? "Merging…" : "Merge"}
          </Button>
        </div>
      </div>
    </div>
  );
}
