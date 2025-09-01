import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthSession } from "@/auth";

export default async function Home() {
  const session = await getServerAuthSession();
  if (session?.user) redirect("/planner");
  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-500 blur-3xl opacity-20 animate-[spin_18s_linear_infinite]" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-500 blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-16 text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Weekend Course Planner</h1>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-[680px] mx-auto">
          Plan your study weekends, spot conflicts fast, and keep credits on track.
          Sign in to create your private schedule — it’s free.
        </p>
        <div className="pt-2">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100"
          >
            Sign in with Google
          </Link>
        </div>
      </div>
    </div>
  );
}

// Tailwind utility for a slower spin
declare global {
  namespace JSX { interface IntrinsicElements {}} // noop to satisfy TS in this file
}
