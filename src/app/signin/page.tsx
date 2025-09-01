"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function SignInContent() {
  const params = useSearchParams();
  const router = useRouter();
  const callbackUrl = params.get("callbackUrl") || "/";
  const reason = params.get("reason");
  const toast = useToast();

  // If already signed in, NextAuth session endpoint will include user
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json().catch(() => null);
        if (!active) return;
        if (data?.user) router.replace("/planner");
      } catch {}
    })();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (reason === "auth") {
      toast({ type: "error", message: "Please sign in to access the app." });
    }
  }, [reason, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Use your Google account to continue.</p>
        <Button
          className="w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </Button>
        <div className="text-xs text-neutral-500">You will be redirected back to the app.</div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
