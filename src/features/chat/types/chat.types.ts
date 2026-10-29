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
