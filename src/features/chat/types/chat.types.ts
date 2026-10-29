export type MessageSide = "incoming" | "outgoing";

export interface ChatMessage {
  id: string;
  side: MessageSide;
  text: string;
  sentAt: string;
  status?: "sent" | "delivered" | "read";
}

export interface ChatContact {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
}
