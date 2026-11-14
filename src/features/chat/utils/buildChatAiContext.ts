import {
  MESSAGE_TYPE,
  CHAT_AI_CONTEXT_MESSAGE_LIMIT,
  CHAT_AI_CONTEXT_TEXT_MAX_LENGTH,
} from "../constants/chat.constants";
import type { ChatAiContextMessage, ChatMessage } from "../types/chat.types";

type ContextSourceMessage = Pick<ChatMessage, "type" | "text" | "senderId" | "side" | "id">;

function normalizeMessageText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isRelevantTextMessage(message: Pick<ChatMessage, "type" | "text">): boolean {
  if (message.type !== MESSAGE_TYPE.text) {
    return false;
  }
  return normalizeMessageText(message.text).length > 0;
}

/**
 * Builds AI context from chat history:
 * - excludes media-only / empty text
 * - returns at most the latest N relevant messages (oldest → newest)
 */
export function buildChatAiContext(
  messages: Array<Pick<ChatMessage, "type" | "text" | "senderId">>,
  currentUserId: string,
  limits: {
    messageLimit?: number;
    textMaxLength?: number;
  } = {},
): ChatAiContextMessage[] {
  const messageLimit = limits.messageLimit ?? CHAT_AI_CONTEXT_MESSAGE_LIMIT;
  const textMaxLength = limits.textMaxLength ?? CHAT_AI_CONTEXT_TEXT_MAX_LENGTH;
  const relevant: ChatAiContextMessage[] = [];

  for (const message of messages) {
    if (!isRelevantTextMessage(message)) {
      continue;
    }

    relevant.push({
      from: message.senderId === currentUserId ? "self" : "peer",
      text: normalizeMessageText(message.text).slice(0, textMaxLength),
    });
  }

  return relevant.slice(-messageLimit);
}

/**
 * Server-side clamp for untrusted client context payloads.
 * Normalizes from/text, drops empties, enforces shared chat-AI limits.
 */
export function clampChatAiContext(
  messages: ChatAiContextMessage[] | undefined,
): ChatAiContextMessage[] {
  if (!messages?.length) {
    return [];
  }

  return messages
    .map((message) => ({
      from: message.from === "self" ? ("self" as const) : ("peer" as const),
      text: normalizeMessageText(message.text).slice(
        0,
        CHAT_AI_CONTEXT_TEXT_MAX_LENGTH,
      ),
    }))
    .filter((message) => message.text.length > 0)
    .slice(-CHAT_AI_CONTEXT_MESSAGE_LIMIT);
}

/**
 * Latest incoming peer text message. Skips media-only / empty text.
 */
export function findLatestIncomingTextMessage(
  messages: ContextSourceMessage[],
  currentUserId: string,
): ContextSourceMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || !isRelevantTextMessage(message)) {
      continue;
    }

    const isIncoming =
      message.side === "incoming" || message.senderId !== currentUserId;
    if (!isIncoming) {
      continue;
    }

    return message;
  }

  return null;
}
