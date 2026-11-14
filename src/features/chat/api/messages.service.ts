import { and, eq, sql } from "drizzle-orm";
import { db } from "@/services/db";
import { archivedMessages, messages } from "@/services/db/schema";
import { logger } from "@/services/logging/logger";
import {
  MESSAGE_HISTORY_MAX_PAGE_SIZE,
  MESSAGE_HISTORY_PAGE_SIZE,
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
  room_id: string;
  type: string;
  text: string;
  media_key: string | null;
  media_content_type: string | null;
  original_file_name: string | null;
  sender_id: string;
  created_at: Date | string;
}): StoredMessage {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at
      : new Date(row.created_at);

  return {
    id: row.id,
    roomId: row.room_id,
    type: toMessageType(row.type),
    text: row.text,
    mediaKey: row.media_key,
    mediaContentType: row.media_content_type,
    originalFileName: row.original_file_name,
    fileCategory: row.media_content_type
      ? getFileCategory(row.media_content_type)
      : null,
    senderId: row.sender_id,
    createdAt: createdAt.toISOString(),
  };
}

function toStoredMessageFromDrizzle(row: {
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

const archivedMessageSelect = {
  id: archivedMessages.id,
  roomId: archivedMessages.roomId,
  type: archivedMessages.type,
  text: archivedMessages.text,
  mediaKey: archivedMessages.mediaKey,
  mediaContentType: archivedMessages.mediaContentType,
  originalFileName: archivedMessages.originalFileName,
  senderId: archivedMessages.senderId,
  createdAt: archivedMessages.createdAt,
};

export function clampHistoryLimit(limit?: number): number {
  const raw = limit ?? MESSAGE_HISTORY_PAGE_SIZE;
  if (!Number.isFinite(raw) || raw <= 0) {
    return MESSAGE_HISTORY_PAGE_SIZE;
  }
  return Math.min(Math.floor(raw), MESSAGE_HISTORY_MAX_PAGE_SIZE);
}

export function isValidBeforeCursor(before: string): boolean {
  return !Number.isNaN(new Date(before).getTime());
}

type HistoryRow = {
  id: string;
  room_id: string;
  type: string;
  text: string;
  media_key: string | null;
  media_content_type: string | null;
  original_file_name: string | null;
  sender_id: string;
  created_at: Date | string;
};

export async function listMessages(input: {
  roomId: string;
  limit?: number;
  before?: string;
  beforeId?: string;
}): Promise<{ messages: StoredMessage[]; hasMore: boolean }> {
  const limit = clampHistoryLimit(input.limit);
  const fetchLimit = limit + 1;
  const useCursor = Boolean(input.before && input.beforeId);

  if (useCursor && input.before && !isValidBeforeCursor(input.before)) {
    throw new Error("Invalid before cursor");
  }

  const cursorClause = useCursor
    ? sql`AND (created_at, id) < (${input.before!}::timestamptz, ${input.beforeId!}::uuid)`
    : sql``;

  const result = await db.execute(sql`
    SELECT
      id,
      room_id,
      type,
      text,
      media_key,
      media_content_type,
      original_file_name,
      sender_id,
      created_at
    FROM (
      SELECT
        id,
        room_id,
        type,
        text,
        media_key,
        media_content_type,
        original_file_name,
        sender_id,
        created_at
      FROM messages
      WHERE room_id = ${input.roomId}
      ${cursorClause}
      UNION ALL
      SELECT
        id,
        room_id,
        type,
        text,
        media_key,
        media_content_type,
        original_file_name,
        sender_id,
        created_at
      FROM archived_messages
      WHERE room_id = ${input.roomId}
      ${cursorClause}
    ) AS combined
    ORDER BY created_at DESC, id DESC
    LIMIT ${fetchLimit}
  `);

  const rows = result.rows as HistoryRow[];
  const hasMore = rows.length > limit;
  const pageDesc = hasMore ? rows.slice(0, limit) : rows;
  const pageAsc = [...pageDesc].reverse();

  return {
    messages: pageAsc.map(toStoredMessage),
    hasMore,
  };
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

  return toStoredMessageFromDrizzle(created);
}

export async function getMessageInRoom(input: {
  messageId: string;
  roomId: string;
}): Promise<StoredMessage | null> {
  const [live] = await db
    .select(messageSelect)
    .from(messages)
    .where(
      and(eq(messages.id, input.messageId), eq(messages.roomId, input.roomId)),
    )
    .limit(1);

  if (live) {
    return toStoredMessageFromDrizzle(live);
  }

  const [archived] = await db
    .select(archivedMessageSelect)
    .from(archivedMessages)
    .where(
      and(
        eq(archivedMessages.id, input.messageId),
        eq(archivedMessages.roomId, input.roomId),
      ),
    )
    .limit(1);

  return archived ? toStoredMessageFromDrizzle(archived) : null;
}

export async function deleteMessageById(messageId: string): Promise<void> {
  const deletedLive = await db
    .delete(messages)
    .where(eq(messages.id, messageId))
    .returning({ id: messages.id });

  if (deletedLive.length > 0) {
    logger.info("Message deleted", { messageId, source: "messages" });
    return;
  }

  const deletedArchived = await db
    .delete(archivedMessages)
    .where(eq(archivedMessages.id, messageId))
    .returning({ id: archivedMessages.id });

  if (deletedArchived.length > 0) {
    logger.info("Message deleted", {
      messageId,
      source: "archived_messages",
    });
    return;
  }

  logger.warn("Message delete found no row", { messageId });
}
