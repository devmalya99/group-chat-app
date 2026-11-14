import type { ChatContact, LookupUser } from "../types/chat.types";

interface ChatSelfUser {
  id: string;
  name: string;
  email: string;
}

interface ChatHeaderProps {
  me: ChatSelfUser | null;
  peer: LookupUser | null;
  contact: ChatContact;
}

export function ChatHeader({ me, peer, contact }: ChatHeaderProps) {
  const peerInitial = (peer?.name || contact.name).slice(0, 1).toUpperCase();
  const meInitial = (me?.name || "Y").slice(0, 1).toUpperCase();
  const peerSubtitle =
    peer?.email ||
    (contact.isOnline ? "Online" : "Join a room to start chatting");

  return (
    <header className="shrink-0 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-sm font-bold text-white">
              {peerInitial}
            </div>
            {contact.isOnline ? (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#4ADE80]" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Chatting with
            </p>
            <h1 className="truncate text-base font-semibold text-slate-900">
              {peer?.name || contact.name}
            </h1>
            <p className="truncate text-xs text-slate-500">{peerSubtitle}</p>
          </div>
        </div>

        {me ? (
          <div className="flex max-w-[42%] shrink-0 items-center gap-2 rounded-2xl bg-[#f4f1ff] px-2.5 py-2">
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6D5BFF]">
                You
              </p>
              <p className="truncate text-xs font-semibold text-slate-800">
                {me.name}
              </p>
              <p className="truncate text-[11px] text-slate-500">{me.email}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#6D5BFF] shadow-sm">
              {meInitial}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
