import type { ButtonHTMLAttributes } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function PrimaryButton({
  children,
  loading = false,
  disabled,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6D5BFF] to-[#4F7CFF] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,91,255,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
