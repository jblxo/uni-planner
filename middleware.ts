import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow Next internals and auth endpoints
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // If signed in and trying to access /signin, redirect to planner
  if (pathname.startsWith("/signin")) {
    if (token) {
      const url = new URL("/planner", req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Public landing page is allowed
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!token) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("reason", "auth");
    url.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
