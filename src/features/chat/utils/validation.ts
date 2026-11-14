import { z } from "zod";
import {
  MESSAGE_TEXT_MAX_LENGTH,
  MESSAGE_TYPE,
} from "../constants/chat.constants";
import {
  getFileSizeLimitLabel,
  getMaxBytesForContentType,
  isAllowedFileContentType,
} from "./filePolicy";

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
    originalFileName: z.string().trim().min(1).max(255).optional(),
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
          message: "File content type is required",
          path: ["mediaContentType"],
        });
        return;
      }

      if (!isAllowedFileContentType(value.mediaContentType)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Unsupported file type. Allowed: images, MP4, PDF, TXT, DOC, DOCX",
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
      originalFileName: value.originalFileName,
      type: hasMedia ? MESSAGE_TYPE.media : MESSAGE_TYPE.text,
    };
  });

export const fileUploadMetaSchema = z
  .object({
    contentType: z.string().trim().min(1, "File content type is required"),
    size: z.number().int().positive("File size must be greater than zero"),
    originalFileName: z.string().trim().min(1).max(255).optional(),
  })
  .superRefine((value, ctx) => {
    if (!isAllowedFileContentType(value.contentType)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Unsupported file type. Allowed: images, MP4, PDF, TXT, DOC, DOCX",
        path: ["contentType"],
      });
      return;
    }

    const maxBytes = getMaxBytesForContentType(value.contentType);
    if (value.size > maxBytes) {
      ctx.addIssue({
        code: "custom",
        message: `File must be ${getFileSizeLimitLabel(value.contentType)} or smaller`,
        path: ["size"],
      });
    }
  });

export const lookupEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .toLowerCase();

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ChatSendInput = z.infer<typeof chatSendSchema>;
export type FileUploadMetaInput = z.infer<typeof fileUploadMetaSchema>;

export function getFirstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
