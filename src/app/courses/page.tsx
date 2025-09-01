import { getCoursesWithCounts } from "@/db/queries";
import { getUserId } from "@/lib/auth";
import { CourseManager } from "@/components/courses/CourseManager";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function Page() {
  const userId = await getUserId();
  if (!userId) redirect("/signin?reason=auth");
  const rows = await getCoursesWithCounts(userId);
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <CourseManager initial={rows} />
    </div>
  );
}
