"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setCourseArchivedAction } from "@/app/actions";

type Row = { id: string; name: string; credits: number; color: string | null; sessionCount: number };

export function ArchiveManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [reactivatingId, setReactivatingId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  async function reactivate(id: string) {
    setReactivatingId(id);
    await setCourseArchivedAction(id, false);
    setReactivatingId("");
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <h1 className="text-2xl font-semibold">Archived courses</h1>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-2 px-2 text-left">Name</th>
              <th className="py-2 px-2 text-left">Credits</th>
              <th className="py-2 px-2 text-left">Sessions</th>
              <th className="py-2 px-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-2 py-2">{r.name}</td>
                <td className="px-2 py-2 w-24">{r.credits}</td>
                <td className="px-2 py-2 w-24">{r.sessionCount}</td>
                <td className="px-2 py-2 w-40">
                  <Button size="sm" onClick={() => reactivate(r.id)} disabled={reactivatingId === r.id}>
                    {reactivatingId === r.id ? "Reactivating…" : "Reactivate"}
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-2 py-6 text-neutral-500" colSpan={4}>Nothing archived.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
