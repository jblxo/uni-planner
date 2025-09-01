import { getServerAuthSession } from "@/auth";

export async function getUserId(): Promise<string | null> {
  const session = await getServerAuthSession();
  return (session as any)?.user?.id ?? null;
}
