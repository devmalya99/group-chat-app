import { z } from "zod";
import { MESSAGE_TEXT_MAX_LENGTH } from "../constants/chat.constants";

export const createMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(MESSAGE_TEXT_MAX_LENGTH, "Message is too long"),
});

export const lookupEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .toLowerCase();

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export function getFirstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
