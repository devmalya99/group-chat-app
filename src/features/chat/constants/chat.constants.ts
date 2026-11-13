import type { ChatContact } from "../types/chat.types";

export const DEMO_CONTACT: ChatContact = {
  id: "contact-group",
  name: "Group Chat",
  isOnline: true,
};

export const MESSAGE_TEXT_MAX_LENGTH = 2000;

export const SOCKET_PATH = "/socket.io";

export const SOCKET_EVENT = {
  chatSend: "chat:send",
  chatMessage: "chat:message",
  chatError: "chat:error",
  joinRoom: "join_room",
  roomJoined: "room:joined",
} as const;
