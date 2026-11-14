import type { ChatContact } from "../types/chat.types";

export const DEMO_CONTACT: ChatContact = {
  id: "contact-group",
  name: "Group Chat",
  isOnline: true,
};

export const MESSAGE_TEXT_MAX_LENGTH = 2000;

/** Max upload size for chat media (5 MB). */
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageContentType =
  (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

export const MESSAGE_TYPE = {
  text: "text",
  media: "media",
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

/** Presigned GET lifetime for room-delivered media URLs (seconds). */
export const MEDIA_SIGNED_URL_EXPIRES_IN = 3600;

export const SOCKET_PATH = "/socket.io";

export const SOCKET_EVENT = {
  chatSend: "chat:send",
  chatMessage: "chat:message",
  chatError: "chat:error",
  joinRoom: "join_room",
  roomJoined: "room:joined",
} as const;
