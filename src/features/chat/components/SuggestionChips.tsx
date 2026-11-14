"use client";

type SuggestionChipsVariant = "soft" | "outline";

interface SuggestionChipsProps {
  suggestions: string[];
  disabled?: boolean;
  ariaLabel: string;
  /** soft = filled chips; outline = WhatsApp-style bordered pills */
  variant?: SuggestionChipsVariant;
  /** CSS justify for the chip row */
  align?: "start" | "end";
  className?: string;
  onSelect: (suggestion: string) => void;
}

const VARIANT_BUTTON: Record<SuggestionChipsVariant, string> = {
  soft: "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs leading-4 text-slate-700 shadow-sm transition hover:border-[#cfc7ff] hover:bg-[#f7f5ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white",
  outline:
    "rounded-full border border-[#6D5BFF] bg-transparent px-3.5 py-1.5 text-left text-[13px] leading-4 text-[#6D5BFF] transition hover:bg-[#f7f5ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
};

/**
 * Quick-select suggestion chips.
 * Selection is handled by the parent (append-to-draft); this never sends.
 */
export function SuggestionChips({
  suggestions,
  disabled = false,
  ariaLabel,
  variant = "soft",
  align = "start",
  className,
  onSelect,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const justify = align === "end" ? "justify-end" : "justify-start";
  const rowClassName =
    className ?? `flex w-full flex-wrap gap-2 ${justify}`;

  return (
    <div className={rowClassName} role="list" aria-label={ariaLabel}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          role="listitem"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className={`max-w-[85%] ${VARIANT_BUTTON[variant]}`}
        >
          <span className="line-clamp-2 break-words">{suggestion}</span>
        </button>
      ))}
    </div>
  );
}
