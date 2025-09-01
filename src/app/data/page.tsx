import Link from "next/link";
import { ImportPanel } from "@/components/data/ImportPanel";

export default function Page() {
  return (
    <div className="min-h-screen p-6 sm:p-10 space-y-6">
      <h1 className="text-2xl font-semibold">Data</h1>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <div className="text-sm">Export all data as JSON:</div>
        <Link href="/api/export" className="underline text-blue-600">/api/export</Link>
        <div className="text-sm mt-3">Export sessions as CSV:</div>
        <Link href="/api/export/csv" className="underline text-blue-600">/api/export/csv</Link>
      </div>
      <ImportPanel />
    </div>
  );
}
