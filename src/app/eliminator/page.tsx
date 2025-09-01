import { getConflictsOrdered } from "@/db/queries";
import { getUserId } from "@/lib/auth";
import { ConflictEliminator } from "@/components/eliminator/ConflictEliminator";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function Page() {
  const userId = await getUserId();
  if (!userId) redirect("/signin?reason=auth");
  const conflicts = await getConflictsOrdered(userId);
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <ConflictEliminator initial={conflicts as any} />
    </div>
  );
}
