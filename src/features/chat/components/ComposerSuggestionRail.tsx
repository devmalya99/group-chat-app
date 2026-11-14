"use client";

import type { ReactNode } from "react";
import { SuggestionChips } from "./SuggestionChips";

interface ComposerSuggestionRailProps {
  showSmartReplies: boolean;
  isGeneratingReplies: boolean;
  replySuggestions: string[];
  wordSuggestions: string[];
  disabled: boolean;
  onSelectReply: (suggestion: string) => void;
  onSelectWord: (suggestion: string) => void;
  children: ReactNode;
}

/** Smart-reply pills above the divider; word chips + composer body below. */
export function ComposerSuggestionRail({
  showSmartReplies,
  isGeneratingReplies,
  replySuggestions,
  wordSuggestions,
  disabled,
  onSelectReply,
  onSelectWord,
  children,
}: ComposerSuggestionRailProps) {
  return (
    <div className="shrink-0 bg-white/95 backdrop-blur">
      {showSmartReplies ? (
        <div
          className="px-3 pb-2 pt-2"
          aria-busy={isGeneratingReplies}
          aria-live="polite"
        >
          {replySuggestions.length > 0 ? (
            <SuggestionChips
              suggestions={replySuggestions}
              disabled={disabled || isGeneratingReplies}
              ariaLabel="Smart reply suggestions"
              variant="outline"
              align="end"
              onSelect={onSelectReply}
            />
          ) : (
            <p className="text-right text-[11px] text-slate-400">
              Generating quick replies…
            </p>
          )}
        </div>
      ) : null}

      <div className="border-t border-slate-100 px-3 py-3">
        <SuggestionChips
          suggestions={wordSuggestions}
          disabled={disabled}
          ariaLabel="Word suggestions"
          variant="soft"
          align="start"
          className="mb-2 flex w-full flex-wrap gap-2 justify-start"
          onSelect={onSelectWord}
        />
        {children}
      </div>
    </div>
  );
}
