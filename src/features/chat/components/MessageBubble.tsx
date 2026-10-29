import type { ChatMessage } from "../types/chat.types";
import { formatMessageTime } from "../utils/formatMessageTime";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.side === "outgoing";
  const timeLabel = formatMessageTime(message.sentAt);

  return (
    <div
      className={`flex w-full ${isOutgoing ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] rounded-[22px] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${
          isOutgoing
            ? "rounded-br-md bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-white"
            : "rounded-bl-md border border-slate-100 bg-white text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-6">{message.text}</p>
        <div
          className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${
            isOutgoing ? "justify-end text-white/75" : "justify-end text-slate-400"
          }`}
        >
          <time dateTime={message.sentAt}>{timeLabel}</time>
          {isOutgoing ? (
            <span aria-label={message.status ?? "sent"} className="tracking-tighter">
              {message.status === "read" ? "✓✓" : "✓"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
