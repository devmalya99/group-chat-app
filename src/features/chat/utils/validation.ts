import { z } from "zod";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MEDIA_MAX_BYTES,
  MESSAGE_TEXT_MAX_LENGTH,
  MESSAGE_TYPE,
} from "../constants/chat.constants";

export const createMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(MESSAGE_TEXT_MAX_LENGTH, "Message is too long"),
  roomId: z.string().trim().min(1, "Room ID is required"),
});

export const chatSendSchema = z
  .object({
    text: z
      .string()
      .trim()
      .max(MESSAGE_TEXT_MAX_LENGTH, "Message is too long")
      .optional(),
    mediaKey: z.string().trim().min(1).optional(),
    mediaContentType: z.string().trim().min(1).optional(),
    mediaUrl: z.string().url().optional(),
  })
  .superRefine((value, ctx) => {
    const text = value.text?.trim() ?? "";
    const hasMedia = Boolean(value.mediaKey);

    if (!hasMedia && !text) {
      ctx.addIssue({
        code: "custom",
        message: "Message cannot be empty",
        path: ["text"],
      });
      return;
    }

    if (hasMedia) {
      if (!value.mediaContentType) {
        ctx.addIssue({
          code: "custom",
          message: "Media content type is required",
          path: ["mediaContentType"],
        });
        return;
      }

      if (
        !ALLOWED_IMAGE_CONTENT_TYPES.includes(
          value.mediaContentType as (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number],
        )
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Only JPEG, PNG, WebP, and GIF images are allowed",
          path: ["mediaContentType"],
        });
      }
    }
  })
  .transform((value) => {
    const text = value.text?.trim() ?? "";
    const hasMedia = Boolean(value.mediaKey);

    return {
      text,
      mediaKey: value.mediaKey,
      mediaContentType: value.mediaContentType,
      mediaUrl: value.mediaUrl,
      type: hasMedia ? MESSAGE_TYPE.media : MESSAGE_TYPE.text,
    };
  });

export const mediaUploadMetaSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_CONTENT_TYPES, {
    message: "Only JPEG, PNG, WebP, and GIF images are allowed",
  }),
  size: z
    .number()
    .int()
    .positive()
    .max(MEDIA_MAX_BYTES, "Image must be 5 MB or smaller"),
});

export const lookupEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .toLowerCase();

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ChatSendInput = z.infer<typeof chatSendSchema>;
export type MediaUploadMetaInput = z.infer<typeof mediaUploadMetaSchema>;

export function getFirstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
