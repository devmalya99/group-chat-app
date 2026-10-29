import { asc } from "drizzle-orm";
import { db } from "@/services/db";
import { messages } from "@/services/db/schema";
import { logger } from "@/services/logging/logger";
import type { StoredMessage } from "../types/chat.types";

function toStoredMessage(row: {
  id: string;
  text: string;
  senderId: string;
  createdAt: Date;
}): StoredMessage {
  return {
    id: row.id,
    text: row.text,
    senderId: row.senderId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listMessages(): Promise<StoredMessage[]> {
  const rows = await db
    .select({
      id: messages.id,
      text: messages.text,
      senderId: messages.senderId,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .orderBy(asc(messages.createdAt));

  return rows.map(toStoredMessage);
}

export async function createMessage(input: {
  text: string;
  senderId: string;
}): Promise<StoredMessage> {
  const [created] = await db
    .insert(messages)
    .values({
      text: input.text,
      senderId: input.senderId,
    })
    .returning({
      id: messages.id,
      text: messages.text,
      senderId: messages.senderId,
      createdAt: messages.createdAt,
    });

  if (!created) {
    logger.error("Message insert returned no row");
    throw new Error("Could not save message");
  }

  logger.info("Message created", {
    messageId: created.id,
    senderId: created.senderId,
  });

  return toStoredMessage(created);
}
