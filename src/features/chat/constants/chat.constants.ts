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
