import { getArchivedCoursesWithCounts } from "@/db/queries";
import { getUserId } from "@/lib/auth";
import { ArchiveManager } from "@/components/archive/ArchiveManager";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function Page() {
  const userId = await getUserId();
  if (!userId) redirect("/signin?reason=auth");
  const rows = await getArchivedCoursesWithCounts(userId);
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <ArchiveManager initial={rows as any} />
    </div>
  );
}
