import type { ChatContact } from "../types/chat.types";

interface ChatHeaderProps {
  contact: ChatContact;
}

export function ChatHeader({ contact }: ChatHeaderProps) {
  const initial = contact.name.slice(0, 1).toUpperCase();

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-sm font-bold text-white">
            {initial}
          </div>
          {contact.isOnline ? (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#4ADE80]" />
          ) : null}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900">
            {contact.name}
          </h1>
          <p className="text-xs font-medium text-[#22c55e]">
            {contact.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-50"
          aria-label="Voice call"
        >
          <PhoneIcon />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-50"
          aria-label="Video call"
        >
          <VideoIcon />
        </button>
      </div>
    </header>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.5 3.75h2.1l1.2 4.2-1.65 1.05a12.3 12.3 0 0 0 5.85 5.85l1.05-1.65 4.2 1.2v2.1A1.5 1.5 0 0 1 18.75 18 14.25 14.25 0 0 1 4.5 3.75a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="6.5"
        width="12"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M15.5 10.5 20 8v8l-4.5-2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
