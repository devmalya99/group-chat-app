"use client";

import {
  useLayoutEffect,
  type KeyboardEvent,
  type RefObject,
} from "react";

const TEXTAREA_MAX_HEIGHT_PX = 112; // max-h-28
const TEXTAREA_MIN_HEIGHT_PX = 28;

interface ComposerTextareaProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

function resizeTextarea(node: HTMLTextAreaElement): void {
  node.style.height = "auto";
  const next = Math.min(
    Math.max(node.scrollHeight, TEXTAREA_MIN_HEIGHT_PX),
    TEXTAREA_MAX_HEIGHT_PX,
  );
  node.style.height = `${next}px`;
}

/** Plain auto-resizing composer textarea — no in-input ghost overlay. */
export function ComposerTextarea({
  textareaRef,
  value,
  placeholder,
  disabled,
  onChange,
  onKeyDown,
}: ComposerTextareaProps) {
  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) {
      return;
    }
    resizeTextarea(node);
  }, [value, textareaRef]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      onChange={(event) => {
        if (disabled) {
          return;
        }
        onChange(event.target.value);
      }}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={disabled}
      aria-label={placeholder}
      className="max-h-28 min-h-[28px] w-full min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-[15px] leading-[1.45] text-slate-800 caret-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}
