import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({
  label,
  error,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5" htmlFor={fieldId}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        id={fieldId}
        className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6D5BFF] focus:ring-4 focus:ring-[#6D5BFF]/15 ${
          error ? "border-rose-400" : "border-slate-200"
        } ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
    </label>
  );
}
