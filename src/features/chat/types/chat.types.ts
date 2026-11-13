export type MessageSide = "incoming" | "outgoing";

export interface ChatMessage {
  id: string;
  side: MessageSide;
  text: string;
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
  text: string;
  senderId: string;
  createdAt: string;
}

export interface MessagesListResponse {
  messages: StoredMessage[];
}

export interface CreateMessagePayload {
  text: string;
}

export interface MessageErrorResponse {
  message: string;
}

export interface ChatSendPayload {
  text: string;
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
