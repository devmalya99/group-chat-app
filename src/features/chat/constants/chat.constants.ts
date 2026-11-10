import type { ChatContact } from "../types/chat.types";

export const DEMO_CONTACT: ChatContact = {
  id: "contact-group",
  name: "Group Chat",
  isOnline: true,
};

export const MESSAGE_TEXT_MAX_LENGTH = 2000;

export const WS_PATH = "/ws";

export const WS_EVENT = {
  chatSend: "chat.send",
  chatMessage: "chat.message",
  error: "error",
} as const;

export const WS_RECONNECT_DELAY_MS = 2000;
