"use client";

import { DEMO_CONTACT } from "../constants/chat.constants";
import { useChatMessages } from "../hooks/useChatMessages";
import type { ChatContact } from "../types/chat.types";
import { ChatHeader } from "./ChatHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import { RoomJoinForm } from "./RoomJoinForm";

export function ChatWindow() {
  const {
    messages,
    loading,
    sending,
    joining,
    connected,
    activeRoomId,
    joinedPeer,
    error,
    sendMessage,
    joinPeerRoom,
  } = useChatMessages();

  const contact: ChatContact = joinedPeer
    ? {
        id: joinedPeer.id,
        name: joinedPeer.name,
        isOnline: Boolean(activeRoomId) && connected,
      }
    : DEMO_CONTACT;

  const canSend = !loading && !sending && connected && Boolean(activeRoomId);

  return (
    <main className="flex min-h-full flex-1 justify-center bg-[linear-gradient(180deg,#f4f1ff_0%,#ffffff_40%,#f3fff8_100%)] p-0 sm:p-6">
      <section className="flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[#f7f5ff] shadow-[0_24px_60px_rgba(88,70,180,0.12)] sm:h-[min(820px,calc(100dvh-3rem))] sm:rounded-[28px] sm:border sm:border-white">
        <ChatHeader contact={contact} />

        <RoomJoinForm
          joinedPeer={joinedPeer}
          activeRoomId={activeRoomId}
          joining={joining}
          disabled={!connected}
          onJoin={joinPeerRoom}
        />

        {!loading ? (
          <p
            className={`shrink-0 px-4 py-1.5 text-center text-[11px] ${
              connected
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {connected
              ? activeRoomId
                ? "Live updates connected · room joined"
                : "Live updates connected · join a room to chat"
              : "Connecting to live chat… (use npm run dev:server)"}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-slate-500">
            Loading…
          </div>
        ) : !activeRoomId ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              No room joined yet
            </p>
            <p className="text-xs leading-5 text-slate-500">
              Enter a registered user email above and join a room to see and
              send personal messages.
            </p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}

        {error ? (
          <p className="shrink-0 border-t border-rose-100 bg-rose-50 px-4 py-2 text-center text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <MessageComposer onSend={sendMessage} disabled={!canSend} />
      </section>
    </main>
  );
}
