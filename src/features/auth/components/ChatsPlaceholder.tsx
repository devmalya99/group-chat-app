"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { AUTH_ROUTES } from "../constants/auth.constants";
import type { AuthSuccessResponse } from "../types/auth.types";
import { clearAuthSession, getAuthSession } from "../utils/session";

export function ChatsPlaceholder() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSuccessResponse | null>(null);

  useEffect(() => {
    const current = getAuthSession();

    if (!current) {
      router.replace(AUTH_ROUTES.login);
      return;
    }

    setSession(current);
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.replace(AUTH_ROUTES.welcome);
  }

  if (!session) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center bg-[#f7f5ff] text-slate-500">
        Loading your workspace...
      </main>
    );
  }

  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(109,91,255,0.12),transparent_35%),linear-gradient(180deg,#ffffff,#f5fff8)] px-4">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-100 bg-white p-8 shadow-[0_24px_60px_rgba(88,70,180,0.1)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-sm font-bold text-white">
            {session.user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              Hi, {session.user.name}
            </p>
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-[#4ADE80]" />
              Online · Auth successful
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">You&apos;re in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Signup/Login is connected to Neon Postgres. Chat rooms come next —
          your session token is ready.
        </p>

        <dl className="mt-6 space-y-3 rounded-2xl bg-[#f7f5ff] p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-800">{session.user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Phone</dt>
            <dd className="font-medium text-slate-800">{session.user.phone}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <PrimaryButton type="button" onClick={handleLogout}>
            Log out
          </PrimaryButton>
        </div>
      </section>
    </main>
  );
}
