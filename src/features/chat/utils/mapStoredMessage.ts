import type { ChatMessage, StoredMessage } from "../types/chat.types";

export function mapStoredMessage(
  message: StoredMessage,
  currentUserId: string,
): ChatMessage {
  const isOutgoing = message.senderId === currentUserId;

  return {
    id: message.id,
    text: message.text,
    senderId: message.senderId,
    sentAt: message.createdAt,
    side: isOutgoing ? "outgoing" : "incoming",
    status: isOutgoing ? "sent" : undefined,
  };
}
