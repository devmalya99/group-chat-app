import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

interface GhostButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function GhostButton({
  href,
  children,
  className = "",
  ...props
}: GhostButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex w-full items-center justify-center rounded-2xl border border-white/70 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
