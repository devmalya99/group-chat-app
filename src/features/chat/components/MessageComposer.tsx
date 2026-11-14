"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { acceptAttributeForFileInput } from "../utils/filePolicy";

interface MessageComposerProps {
  onSend: (text: string) => void | Promise<void>;
  onSendFile?: (file: File) => void | Promise<void>;
  disabled?: boolean;
  uploading?: boolean;
  placeholder?: string;
}

export function MessageComposer({
  onSend,
  onSendFile,
  disabled = false,
  uploading = false,
  placeholder = "Type a message...",
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFile = onSendFile;

  useEffect(() => {
    if (disabled) {
      setText("");
    }
  }, [disabled]);

  function submit() {
    const next = text.trim();
    if (!next || disabled || uploading) {
      return;
    }
    void onSend(next);
    setText("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (disabled || uploading) {
      event.preventDefault();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function openFilePicker() {
    if (disabled || uploading || !handleFile) {
      return;
    }
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !handleFile || disabled || uploading) {
      return;
    }

    void handleFile(file);
  }

  const controlsDisabled = disabled || uploading;

  return (
    <form
      onSubmit={handleSubmit}
      aria-disabled={controlsDisabled}
      className={`shrink-0 border-t border-slate-100 bg-white/95 px-3 py-3 backdrop-blur ${
        controlsDisabled ? "opacity-70" : ""
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttributeForFileInput()}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
        <button
          type="button"
          disabled={controlsDisabled || !handleFile}
          onClick={openFilePicker}
          className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#6D5BFF] hover:bg-[#f7f5ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          aria-label="Upload file"
        >
          <PlusIcon />
        </button>

        <div
          className={`flex min-w-0 flex-1 items-end rounded-[22px] border px-3 py-2 ${
            controlsDisabled
              ? "border-slate-200 bg-slate-100"
              : "border-slate-200 bg-[#f8f7fc]"
          }`}
        >
          <textarea
            rows={1}
            value={text}
            onChange={(event) => {
              if (controlsDisabled) {
                return;
              }
              setText(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? "Uploading file..." : placeholder}
            disabled={controlsDisabled}
            readOnly={controlsDisabled}
            aria-label={placeholder}
            className="max-h-28 min-h-[28px] w-full resize-none bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            disabled={controlsDisabled}
            className="mb-0.5 ml-2 shrink-0 text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Emoji"
          >
            <EmojiIcon />
          </button>
        </div>

        {text.trim() && !controlsDisabled ? (
          <button
            type="submit"
            disabled={controlsDisabled}
            className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-white shadow-[0_10px_24px_rgba(109,91,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        ) : (
          <button
            type="button"
            disabled={controlsDisabled}
            className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-white shadow-[0_10px_24px_rgba(109,91,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={uploading ? "Uploading file" : "Voice message"}
          >
            {uploading ? <SpinnerIcon /> : <MicIcon />}
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

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M20 12a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
