import type { ChatContact } from "../types/chat.types";
import {
  ALLOWED_DOCUMENT_CONTENT_TYPES,
  ALLOWED_FILE_CONTENT_TYPES,
  ALLOWED_IMAGE_CONTENT_TYPES,
  ALLOWED_VIDEO_CONTENT_TYPES,
  FILE_CATEGORY,
  FILE_MAX_BYTES_DEFAULT,
  FILE_MAX_BYTES_VIDEO,
  type AllowedFileContentType,
  type FileCategory,
} from "../utils/filePolicy";

export const DEMO_CONTACT: ChatContact = {
  id: "contact-group",
  name: "Group Chat",
  isOnline: true,
};

export const MESSAGE_TEXT_MAX_LENGTH = 2000;

/** Initial / scroll-up page size for room history (live + archive). */
export const MESSAGE_HISTORY_PAGE_SIZE = 10;

/** Hard cap for history page size (API + service). */
export const MESSAGE_HISTORY_MAX_PAGE_SIZE = 50;

export {
  FILE_MAX_BYTES_DEFAULT,
  FILE_MAX_BYTES_VIDEO,
  ALLOWED_IMAGE_CONTENT_TYPES,
  ALLOWED_VIDEO_CONTENT_TYPES,
  ALLOWED_DOCUMENT_CONTENT_TYPES,
  ALLOWED_FILE_CONTENT_TYPES,
  FILE_CATEGORY,
};

export type { AllowedFileContentType, FileCategory };

export const MESSAGE_TYPE = {
  text: "text",
  /** File attachment message (image, video, or document). */
  media: "media",
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

/** Presigned GET lifetime for room-authorized file URLs (seconds). */
export const MEDIA_SIGNED_URL_EXPIRES_IN = 3600;

export const SOCKET_PATH = "/socket.io";

export const SOCKET_EVENT = {
  chatSend: "chat:send",
  chatMessage: "chat:message",
  chatFileDeleted: "chat:file-deleted",
  chatError: "chat:error",
  joinRoom: "join_room",
  roomJoined: "room:joined",
} as const;

/** Shared chat-AI context limits (predict + smart replies). */
export const CHAT_AI_CONTEXT_MESSAGE_LIMIT = 5;
export const CHAT_AI_CONTEXT_TEXT_MAX_LENGTH = 280;

/**
 * Best-effort in-memory per-user AI limits (reset on process restart).
 * Not a multi-instance global quota on serverless.
 */
export const CHAT_AI_RATE_LIMIT_PER_MINUTE = 20;
export const CHAT_AI_RATE_LIMIT_MAX_CONCURRENT = 5;
export const CHAT_AI_RATE_LIMIT_WINDOW_MS = 60_000;

/** Predictive typing — independently toggleable via PREDICTIVE_TYPING_ENABLED. */
export const PREDICTIVE_TYPING_DEBOUNCE_MS = 500;
export const PREDICTIVE_TYPING_MIN_DRAFT_LENGTH = 3;
export const PREDICTIVE_TYPING_MAX_SUGGESTION_CHARS = 80;
export const PREDICTIVE_TYPING_MAX_OUTPUT_TOKENS = 60;
export const PREDICTIVE_TYPING_TIMEOUT_MS = 4000;

/** Smart Replies — independently toggleable via SMART_REPLIES_ENABLED. */
export const SMART_REPLIES_MAX_SUGGESTION_CHARS = 80;
export const SMART_REPLIES_MIN_SUGGESTIONS = 2;
export const SMART_REPLIES_MAX_SUGGESTIONS = 3;
export const SMART_REPLIES_MAX_OUTPUT_TOKENS = 160;
export const SMART_REPLIES_TIMEOUT_MS = 6000;

function isEnabledFlag(value: string | undefined): boolean {
  const flag = value?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") {
    return false;
  }
  return true;
}

/**
 * Feature toggle. Set PREDICTIVE_TYPING_ENABLED=false to disable without
 * affecting normal chat. Defaults to enabled when unset.
 */
export function isPredictiveTypingEnabled(): boolean {
  return isEnabledFlag(process.env.PREDICTIVE_TYPING_ENABLED);
}

/**
 * Authoritative server feature toggle. Set SMART_REPLIES_ENABLED=false to
 * disable without affecting normal chat. Defaults to enabled when unset.
 */
export function isSmartRepliesEnabled(): boolean {
  return isEnabledFlag(process.env.SMART_REPLIES_ENABLED);
}

/**
 * Client UI toggle only — not authorization. Set
 * NEXT_PUBLIC_SMART_REPLIES_ENABLED=false to hide smart replies / skip requests.
 * Backend `isSmartRepliesEnabled()` remains the security boundary.
 */
export function isSmartRepliesEnabledOnClient(): boolean {
  return isEnabledFlag(process.env.NEXT_PUBLIC_SMART_REPLIES_ENABLED);
}
