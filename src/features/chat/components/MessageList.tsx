"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/chat.types";
import {
  formatDayLabel,
  isSameCalendarDay,
} from "../utils/formatMessageTime";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const showDayDivider =
            !previous || !isSameCalendarDay(previous.sentAt, message.sentAt);

          return (
            <div key={message.id} className="flex flex-col gap-3">
              {showDayDivider && nowMs !== null ? (
                <div className="flex justify-center py-1">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
                    {formatDayLabel(message.sentAt, nowMs)}
                  </span>
                </div>
              ) : null}
              <MessageBubble message={message} />
            </div>
          );
        })}
        <div ref={bottomRef} aria-hidden />
      </div>
    </div>
  );
}
