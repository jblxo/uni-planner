"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/eliminator", label: "Eliminator" },
  { href: "/archive", label: "Archive" },
  { href: "/data", label: "Data" },
];

export function AppNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [user, setUser] = useState<{ name?: string; image?: string; email?: string } | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json().catch(() => null);
        if (active) {
          setSignedIn(!!data?.user);
          setUser(data?.user || null);
        }
      } catch {}
    })();
    return () => { active = false; };
  }, []);
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-800 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 flex items-center h-14 gap-4">
        <Link href="/" className="font-semibold text-sm whitespace-nowrap">Uni Planner</Link>
        {/* Left: nav items (hidden when signed out or on /signin) */}
        <nav className="flex-1 flex items-center gap-2 overflow-x-auto">
          {signedIn && !pathname?.startsWith("/signin") && items.map((it) => {
            const active = pathname === it.href || (it.href === "/" && pathname === "/planner") || pathname?.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                className={
                  (active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                    : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700") +
                  " px-3 py-1.5 rounded-md text-sm transition-colors"
                }
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        {/* Right: account area (outside overflow to avoid clipping) */}
        {signedIn ? (
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-neutral-600 dark:text-neutral-300">Signed in as <span className="font-medium">{user?.name || user?.email || "User"}</span></span>
            <UserMenu name={user?.name} image={user?.image} email={user?.email} />
          </div>
        ) : (
          <Link href="/signin" className="px-3 py-1.5 rounded-md text-sm bg-neutral-900 text-white dark:bg-white dark:text-black">Sign in</Link>
        )}
      </div>
    </header>
  );
}

function UserMenu({ name, image, email }: { name?: string; image?: string; email?: string }) {
  const [open, setOpen] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
        onClick={() => setOpen((v) => !v)}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="avatar" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold">
            {initial}
          </div>
        )}
        <span className="text-sm hidden sm:inline">{name || "Account"}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 min-w-[220px] rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md p-2 space-y-1">
          <div className="px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300">
            Signed in as
            <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{name || email || "User"}</div>
          </div>
          <Link href="/api/auth/signout" className="block px-3 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm">
            Sign out
          </Link>
        </div>
      )}
    </div>
  );
}
