"use client";

import { useState } from "react";
import {
  DEMO_CONTACT,
  DEMO_MESSAGES,
} from "../constants/chat.constants";
import type { ChatMessage } from "../types/chat.types";
import { ChatHeader } from "./ChatHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_MESSAGES);

  function handleSend(text: string) {
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        side: "outgoing",
        text,
        sentAt: new Date().toISOString(),
        status: "sent",
      },
    ]);
  }

  return (
    <main className="flex min-h-full flex-1 justify-center bg-[linear-gradient(180deg,#f4f1ff_0%,#ffffff_40%,#f3fff8_100%)] p-0 sm:p-6">
      <section className="flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[#f7f5ff] shadow-[0_24px_60px_rgba(88,70,180,0.12)] sm:h-[min(820px,calc(100dvh-3rem))] sm:rounded-[28px] sm:border sm:border-white">
        <ChatHeader contact={DEMO_CONTACT} />
        <MessageList messages={messages} />
        <MessageComposer onSend={handleSend} />
      </section>
    </main>
  );
}
