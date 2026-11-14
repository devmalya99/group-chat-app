import { MESSAGE_TYPE } from "../constants/chat.constants";
import type { ChatMessage, StoredMessage } from "../types/chat.types";

export function mapStoredMessage(
  message: StoredMessage,
  currentUserId: string,
): ChatMessage {
  const isOutgoing = message.senderId === currentUserId;

  return {
    id: message.id,
    type: message.type ?? MESSAGE_TYPE.text,
    text: message.text,
    roomId: message.roomId,
    mediaKey: message.mediaKey,
    mediaContentType: message.mediaContentType,
    mediaUrl: message.mediaUrl,
    senderId: message.senderId,
    sentAt: message.createdAt,
    side: isOutgoing ? "outgoing" : "incoming",
    status: isOutgoing ? "sent" : undefined,
  };
}
