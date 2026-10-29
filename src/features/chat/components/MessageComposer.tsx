"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

interface MessageComposerProps {
  onSend: (text: string) => void;
}

export function MessageComposer({ onSend }: MessageComposerProps) {
  const [text, setText] = useState("");

  function submit() {
    const next = text.trim();
    if (!next) {
      return;
    }
    onSend(next);
    setText("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-slate-100 bg-white/95 px-3 py-3 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
        <button
          type="button"
          className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#6D5BFF] hover:bg-[#f7f5ff]"
          aria-label="Add attachment"
        >
          <PlusIcon />
        </button>

        <div className="flex min-w-0 flex-1 items-end rounded-[22px] border border-slate-200 bg-[#f8f7fc] px-3 py-2">
          <textarea
            rows={1}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="max-h-28 min-h-[28px] w-full resize-none bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            className="mb-0.5 ml-2 shrink-0 text-slate-400"
            aria-label="Emoji"
          >
            <EmojiIcon />
          </button>
        </div>

        {text.trim() ? (
          <button
            type="submit"
            className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-white shadow-[0_10px_24px_rgba(109,91,255,0.35)]"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        ) : (
          <button
            type="button"
            className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-white shadow-[0_10px_24px_rgba(109,91,255,0.35)]"
            aria-label="Voice message"
          >
            <MicIcon />
          </button>
        )}
      </div>
    </form>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.5 13.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="9.25" cy="10" r="1" fill="currentColor" />
      <circle cx="14.75" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="3.5"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11.5 20 4l-5.5 16-3-6.5L4 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
