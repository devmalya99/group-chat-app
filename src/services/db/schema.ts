import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_phone_unique").on(table.phone),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: text("room_id").notNull().default(""),
    type: text("type").notNull().default("text"),
    text: text("text").notNull().default(""),
    mediaKey: text("media_key"),
    mediaContentType: text("media_content_type"),
    originalFileName: text("original_file_name"),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_room_created_at_idx").on(table.roomId, table.createdAt),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Cold storage for messages moved out of `messages` by the archive cron.
 * Row ids are preserved from the original message so clients keep stable ids.
 */
export const archivedMessages = pgTable(
  "archived_messages",
  {
    id: uuid("id").primaryKey(),
    roomId: text("room_id").notNull().default(""),
    type: text("type").notNull().default("text"),
    text: text("text").notNull().default(""),
    mediaKey: text("media_key"),
    mediaContentType: text("media_content_type"),
    originalFileName: text("original_file_name"),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("archived_messages_room_created_at_idx").on(
      table.roomId,
      table.createdAt,
    ),
    index("archived_messages_created_at_idx").on(table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type ArchivedMessage = typeof archivedMessages.$inferSelect;
export type NewArchivedMessage = typeof archivedMessages.$inferInsert;
