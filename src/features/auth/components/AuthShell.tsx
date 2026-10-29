import Link from "next/link";
import type { ReactNode } from "react";
import { AUTH_ROUTES } from "../constants/auth.constants";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,91,255,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.16),transparent_35%),linear-gradient(180deg,#f7f5ff_0%,#ffffff_55%,#f3fff8_100%)]" />

      <div className="relative w-full max-w-md">
        <Link
          href={AUTH_ROUTES.welcome}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#6D5BFF]"
        >
          <span aria-hidden>←</span> Back
        </Link>

        <section className="rounded-[28px] border border-white/80 bg-white/90 p-7 shadow-[0_24px_60px_rgba(88,70,180,0.12)] backdrop-blur">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6D5BFF]">
              Group Chat
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>

          {children}

          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        </section>
      </div>
    </main>
  );
}
