import type {
  FileCategory,
  MessageType,
} from "../constants/chat.constants";

export type MessageSide = "incoming" | "outgoing";

export interface ChatMessage {
  id: string;
  side: MessageSide;
  type: MessageType;
  text: string;
  roomId: string;
  mediaKey?: string | null;
  mediaContentType?: string | null;
  mediaUrl?: string | null;
  originalFileName?: string | null;
  fileCategory?: FileCategory | null;
  fileSize?: number | null;
  sentAt: string;
  senderId: string;
  status?: "sent" | "delivered" | "read";
}

export interface ChatContact {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export interface StoredMessage {
  id: string;
  roomId: string;
  type: MessageType;
  text: string;
  mediaKey?: string | null;
  mediaContentType?: string | null;
  /** Short-lived signed URL; issued only for authorized room members. */
  mediaUrl?: string | null;
  originalFileName?: string | null;
  fileCategory?: FileCategory | null;
  fileSize?: number | null;
  senderId: string;
  createdAt: string;
}

export interface MessagesListResponse {
  messages: StoredMessage[];
  hasMore: boolean;
}

export interface FetchMessagesOptions {
  roomId: string;
  limit?: number;
  /** ISO createdAt of the oldest message already loaded (scroll-up cursor). */
  before?: string;
  /** Id tie-breaker for the `before` cursor. */
  beforeId?: string;
}

export interface CreateMessagePayload {
  text: string;
  roomId: string;
}

export interface MessageErrorResponse {
  message: string;
}

export interface ChatSendPayload {
  text?: string;
  mediaKey?: string;
  mediaContentType?: string;
  originalFileName?: string;
}

export interface ChatMessagePayload {
  message: StoredMessage;
}

export interface ChatFileDeletedPayload {
  roomId: string;
  messageId: string;
}

export interface ChatErrorPayload {
  message: string;
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface RoomJoinedPayload {
  roomId: string;
}

export interface LookupUser {
  id: string;
  name: string;
  email: string;
}

export interface LookupUserResponse {
  user: LookupUser;
}

export interface FileUploadResponse {
  key: string;
  contentType: string;
  url: string;
  originalFileName: string;
  fileCategory: FileCategory;
  fileSize: number;
}
