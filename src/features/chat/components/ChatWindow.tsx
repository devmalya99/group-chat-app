"use client";

import { DEMO_CONTACT } from "../constants/chat.constants";
import { useChatMessages } from "../hooks/useChatMessages";
import { ChatHeader } from "./ChatHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

export function ChatWindow() {
  const { messages, loading, sending, error, sendMessage } = useChatMessages();

  return (
    <main className="flex min-h-full flex-1 justify-center bg-[linear-gradient(180deg,#f4f1ff_0%,#ffffff_40%,#f3fff8_100%)] p-0 sm:p-6">
      <section className="flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[#f7f5ff] shadow-[0_24px_60px_rgba(88,70,180,0.12)] sm:h-[min(820px,calc(100dvh-3rem))] sm:rounded-[28px] sm:border sm:border-white">
        <ChatHeader contact={DEMO_CONTACT} />

        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-slate-500">
            Loading messages…
          </div>
        ) : (
          <MessageList messages={messages} />
        )}

        {error ? (
          <p className="shrink-0 border-t border-rose-100 bg-rose-50 px-4 py-2 text-center text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <MessageComposer onSend={sendMessage} disabled={loading || sending} />
      </section>
    </main>
  );
}
