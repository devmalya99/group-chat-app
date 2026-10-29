import Link from "next/link";
import { GhostButton } from "@/shared/components/GhostButton";
import { AUTH_ROUTES } from "../constants/auth.constants";

export function WelcomeHero() {
  return (
    <main className="relative flex min-h-full flex-1 overflow-hidden bg-[linear-gradient(160deg,#1b1148_0%,#2a1b6d_45%,#3b2a9a_100%)] text-white">
      <div className="pointer-events-none absolute -left-16 top-20 h-56 w-56 rounded-full bg-[#6D5BFF]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-[#4ADE80]/25 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-md flex-col justify-between px-6 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] shadow-lg shadow-[#6D5BFF]/40">
            <span className="text-lg font-bold">GC</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Group Chat</p>
            <p className="text-xs text-white/60">Connect without the noise</p>
          </div>
        </div>

        <div className="my-12">
          <div className="mb-10 flex items-end gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#7B6CFF] to-[#5B8CFF] text-4xl shadow-2xl shadow-black/30">
              …
            </div>
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white text-3xl shadow-2xl shadow-black/20">
              💜
            </div>
          </div>

          <h1 className="max-w-[12ch] text-5xl font-bold leading-[1.05] tracking-tight">
            Connect. Chat. Share.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-white/70">
            A clean space for groups, status, and real conversations — built for
            people who want clarity over clutter.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={AUTH_ROUTES.signup}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6D5BFF] to-[#4F7CFF] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,91,255,0.45)] transition hover:brightness-105"
          >
            Create Account
          </Link>
          <GhostButton href={AUTH_ROUTES.login}>Login</GhostButton>
          <p className="pt-2 text-center text-sm text-white/55">
            Secure signup with email, phone, and encrypted passwords.
          </p>
        </div>
      </div>
    </main>
  );
}
