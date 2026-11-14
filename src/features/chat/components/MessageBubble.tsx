"use client";

import { FILE_CATEGORY, MESSAGE_TYPE } from "../constants/chat.constants";
import type { ChatMessage } from "../types/chat.types";
import { formatMessageTime } from "../utils/formatMessageTime";
import { FileDownloadCard } from "./FileDownloadCard";

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string | null;
  onDeleteFile?: (messageId: string) => void | Promise<void>;
}

export function MessageBubble({
  message,
  currentUserId,
  onDeleteFile,
}: MessageBubbleProps) {
  const isOutgoing = message.side === "outgoing";
  const timeLabel = formatMessageTime(message.sentAt);
  const isMedia = message.type === MESSAGE_TYPE.media;
  const isImage = message.fileCategory === FILE_CATEGORY.image;
  const fileLabel = message.originalFileName || "Shared file";

  // Only the original uploader sees Delete (never peers).
  const isUploader =
    Boolean(currentUserId) && message.senderId === currentUserId;
  const canDelete = Boolean(isMedia && isUploader && onDeleteFile);

  return (
    <div
      className={`flex w-full ${isOutgoing ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${
          isOutgoing
            ? "rounded-br-md bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-white"
            : "rounded-bl-md border border-slate-100 bg-white text-slate-800"
        } ${isMedia ? "p-2" : "px-4 py-3"}`}
      >
        {isMedia && isImage ? (
          message.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed URLs are dynamic
            <img
              src={message.mediaUrl}
              alt={fileLabel}
              className="max-h-72 w-full rounded-[16px] object-cover"
            />
          ) : (
            <p
              className={`px-2 py-1 text-[13px] ${
                isOutgoing ? "text-white/80" : "text-slate-500"
              }`}
            >
              Image unavailable
            </p>
          )
        ) : null}

        {isMedia && !isImage ? (
          <FileDownloadCard
            fileName={fileLabel}
            category={message.fileCategory ?? null}
            url={message.mediaUrl}
            isOutgoing={isOutgoing}
          />
        ) : null}

        {!isMedia && message.text ? (
          <p className="whitespace-pre-wrap text-[15px] leading-6">
            {message.text}
          </p>
        ) : null}

        {isMedia && message.text ? (
          <p className="mt-2 px-2 whitespace-pre-wrap text-[15px] leading-6">
            {message.text}
          </p>
        ) : null}

        <div
          className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${
            isMedia ? "px-2 pb-1" : ""
          } ${
            isOutgoing ? "justify-end text-white/75" : "justify-end text-slate-400"
          }`}
        >
          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                void onDeleteFile?.(message.id);
              }}
              className="mr-auto rounded px-1.5 py-0.5 text-[11px] font-medium text-white/90 hover:bg-white/15"
              aria-label="Delete file"
            >
              Delete
            </button>
          ) : null}
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
