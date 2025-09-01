import { Planner } from "@/components/planner/Planner";
import { getPlannerData } from "@/db/queries";
import { getUserId } from "@/lib/auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function Page() {
  const userId = await getUserId();
  if (!userId) redirect("/signin?reason=auth");
  const data = await getPlannerData(userId);
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <Planner initialLectures={data.lectures} initialCourses={data.courses} />
    </div>
  );
}
