"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { importDataAction, importCsvAction } from "@/app/actions";

export function ImportPanel() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string>("");
  const [csvStatus, setCsvStatus] = useState<string>("");
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
      <div className="text-sm">Import JSON (replaces all data):</div>
      <textarea
        className="w-full h-48 p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent"
        placeholder="Paste JSON here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2 items-center">
        <Button onClick={async () => { setStatus("Importing..."); await importDataAction(text); setStatus("Done"); }}>Import</Button>
        <div className="text-sm text-neutral-500">{status}</div>
      </div>
      <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />
      <div className="space-y-2">
        <div className="text-sm font-medium">Import CSV (Power BI export)</div>
        <div className="text-xs text-neutral-500">Expected headers: course_name, credits, color, date (YYYY-MM-DD), start (HH:mm), end (HH:mm). You can also use Course/Name, Credits, Color, Date, Start, End.</div>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setCsvStatus("Reading...");
            const text = await file.text();
            setCsvStatus("Importing...");
            await importCsvAction(text);
            setCsvStatus("Done");
          }}
        />
        <div className="text-sm text-neutral-500">{csvStatus}</div>
      </div>
    </div>
  );
}
