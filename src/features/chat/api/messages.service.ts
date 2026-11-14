import { and, asc, eq } from "drizzle-orm";
import { db } from "@/services/db";
import { messages } from "@/services/db/schema";
import { logger } from "@/services/logging/logger";
import {
  MESSAGE_TYPE,
  type MessageType,
} from "../constants/chat.constants";
import type { StoredMessage } from "../types/chat.types";
import { getFileCategory } from "../utils/filePolicy";

function toMessageType(value: string): MessageType {
  return value === MESSAGE_TYPE.media ? MESSAGE_TYPE.media : MESSAGE_TYPE.text;
}

function toStoredMessage(row: {
  id: string;
  roomId: string;
  type: string;
  text: string;
  mediaKey: string | null;
  mediaContentType: string | null;
  originalFileName: string | null;
  senderId: string;
  createdAt: Date;
}): StoredMessage {
  return {
    id: row.id,
    roomId: row.roomId,
    type: toMessageType(row.type),
    text: row.text,
    mediaKey: row.mediaKey,
    mediaContentType: row.mediaContentType,
    originalFileName: row.originalFileName,
    fileCategory: row.mediaContentType
      ? getFileCategory(row.mediaContentType)
      : null,
    senderId: row.senderId,
    createdAt: row.createdAt.toISOString(),
  };
}

const messageSelect = {
  id: messages.id,
  roomId: messages.roomId,
  type: messages.type,
  text: messages.text,
  mediaKey: messages.mediaKey,
  mediaContentType: messages.mediaContentType,
  originalFileName: messages.originalFileName,
  senderId: messages.senderId,
  createdAt: messages.createdAt,
};

export async function listMessages(roomId?: string): Promise<StoredMessage[]> {
  const rows = roomId
    ? await db
        .select(messageSelect)
        .from(messages)
        .where(eq(messages.roomId, roomId))
        .orderBy(asc(messages.createdAt))
    : await db
        .select(messageSelect)
        .from(messages)
        .orderBy(asc(messages.createdAt));

  return rows.map(toStoredMessage);
}

export async function createMessage(input: {
  text: string;
  senderId: string;
  roomId: string;
  type?: MessageType;
  mediaKey?: string | null;
  mediaContentType?: string | null;
  originalFileName?: string | null;
}): Promise<StoredMessage> {
  const type = input.type ?? MESSAGE_TYPE.text;

  const [created] = await db
    .insert(messages)
    .values({
      text: input.text,
      senderId: input.senderId,
      roomId: input.roomId,
      type,
      mediaKey: input.mediaKey ?? null,
      mediaContentType: input.mediaContentType ?? null,
      originalFileName: input.originalFileName ?? null,
    })
    .returning(messageSelect);

  if (!created) {
    logger.error("Message insert returned no row");
    throw new Error("Could not save message");
  }

  logger.info("Message created", {
    messageId: created.id,
    senderId: created.senderId,
    roomId: created.roomId,
    type: created.type,
  });

  return toStoredMessage(created);
}

export async function getMessageInRoom(input: {
  messageId: string;
  roomId: string;
}): Promise<StoredMessage | null> {
  const [row] = await db
    .select(messageSelect)
    .from(messages)
    .where(
      and(eq(messages.id, input.messageId), eq(messages.roomId, input.roomId)),
    )
    .limit(1);

  return row ? toStoredMessage(row) : null;
}

export async function deleteMessageById(messageId: string): Promise<void> {
  await db.delete(messages).where(eq(messages.id, messageId));
  logger.info("Message deleted", { messageId });
}
