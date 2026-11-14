import type { MessageType } from "../constants/chat.constants";

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
  /** Short-lived signed URL; only set when issued for an authorized room member. */
  mediaUrl?: string | null;
  senderId: string;
  createdAt: string;
}

export interface MessagesListResponse {
  messages: StoredMessage[];
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
  mediaUrl?: string;
}

export interface ChatMessagePayload {
  message: StoredMessage;
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

export interface MediaUploadResponse {
  key: string;
  contentType: string;
  url: string;
}
