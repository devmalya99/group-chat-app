"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { HistoryScrollReason } from "../hooks/useChatHistory";
import type { ChatMessage } from "../types/chat.types";
import {
  formatDayLabel,
  isSameCalendarDay,
} from "../utils/formatMessageTime";
import { MessageBubble } from "./MessageBubble";

const LOAD_OLDER_THRESHOLD_PX = 80;
const STICK_TO_BOTTOM_THRESHOLD_PX = 120;

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  scrollReason: HistoryScrollReason | null;
  onScrollReasonHandled: () => void;
  onLoadOlder: () => void | Promise<void>;
  onDeleteFile?: (messageId: string) => void | Promise<void>;
}

export function MessageList({
  messages,
  currentUserId,
  hasMore,
  loadingMore,
  scrollReason,
  onScrollReasonHandled,
  onLoadOlder,
  onDeleteFile,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pendingRestoreRef = useRef<{ height: number; top: number } | null>(
    null,
  );
  const [nowMs] = useState(() => Date.now());

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !scrollReason) {
      return;
    }

    if (scrollReason === "prepend") {
      const pending = pendingRestoreRef.current;
      if (pending) {
        container.scrollTop =
          pending.top + (container.scrollHeight - pending.height);
        pendingRestoreRef.current = null;
      }
      onScrollReasonHandled();
      return;
    }

    if (scrollReason === "replace") {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      onScrollReasonHandled();
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom <= STICK_TO_BOTTOM_THRESHOLD_PX) {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }

    onScrollReasonHandled();
  }, [messages, scrollReason, onScrollReasonHandled]);

  async function handleLoadOlder() {
    if (!hasMore || loadingMore) {
      return;
    }

    const container = scrollRef.current;
    if (container) {
      pendingRestoreRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
    }

    await onLoadOlder();
  }

  function handleScroll() {
    const container = scrollRef.current;
    if (!container || !hasMore || loadingMore) {
      return;
    }

    if (container.scrollTop <= LOAD_OLDER_THRESHOLD_PX) {
      void handleLoadOlder();
    }
  }

  return (
    <div className="relative min-h-0 flex-1">
      {loadingMore ? (
        <p className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center text-[11px] text-slate-400">
          Loading older messages…
        </p>
      ) : null}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-contain px-4 py-5"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          {!hasMore && messages.length > 0 ? (
            <p className="py-1 text-center text-[11px] text-slate-400">
              Beginning of conversation
            </p>
          ) : null}
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const showDayDivider =
              !previous || !isSameCalendarDay(previous.sentAt, message.sentAt);

            return (
              <div key={message.id} className="flex flex-col gap-3">
                {showDayDivider ? (
                  <div className="flex justify-center py-1">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
                      {formatDayLabel(message.sentAt, nowMs)}
                    </span>
                  </div>
                ) : null}
                <MessageBubble
                  message={message}
                  currentUserId={currentUserId}
                  onDeleteFile={onDeleteFile}
                />
              </div>
            );
          })}
          <div ref={bottomRef} aria-hidden />
        </div>
      </div>
    </div>
  );
}
