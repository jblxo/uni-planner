// Better Auth setup with dynamic imports so the app can build
// even if auth packages are not yet installed. Once packages and
// env vars are present, this module will export live handlers and
// getSession() to fetch the current user.

import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { adoptLegacyDataForUser } from "@/db/queries";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        const userId = user?.id;
        if (userId) {
          await adoptLegacyDataForUser(userId);
        }
      } catch {
        // best-effort; ignore errors
      }
    },
  },
};

export async function getServerAuthSession() {
  const { getServerSession } = await import("next-auth");
  return getServerSession(authOptions);
}
