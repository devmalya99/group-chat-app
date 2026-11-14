import { z } from "zod";
import {
  CHAT_AI_CONTEXT_MESSAGE_LIMIT,
  CHAT_AI_CONTEXT_TEXT_MAX_LENGTH,
  MESSAGE_TEXT_MAX_LENGTH,
  MESSAGE_TYPE,
  PREDICTIVE_TYPING_MIN_DRAFT_LENGTH,
  SMART_REPLIES_MAX_SUGGESTIONS,
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

const chatAiContextMessageSchema = z.object({
  from: z.enum(["self", "peer"]),
  text: z
    .string()
    .trim()
    .min(1, "Context message cannot be empty")
    .max(CHAT_AI_CONTEXT_TEXT_MAX_LENGTH, "Context message is too long"),
});

const chatAiRecentMessagesSchema = z
  .array(chatAiContextMessageSchema)
  .max(
    CHAT_AI_CONTEXT_MESSAGE_LIMIT,
    `At most ${CHAT_AI_CONTEXT_MESSAGE_LIMIT} recent messages are allowed`,
  )
  .optional()
  .default([]);

export const predictTypingSchema = z.object({
  roomId: z.string().trim().min(1, "Room ID is required"),
  draft: z
    .string()
    .min(PREDICTIVE_TYPING_MIN_DRAFT_LENGTH, "Draft is too short")
    .max(MESSAGE_TEXT_MAX_LENGTH, "Draft is too long"),
  recentMessages: chatAiRecentMessagesSchema,
});

export const predictTypingResponseSchema = z.object({
  suggestion: z.string(),
});

export const smartRepliesSchema = z.object({
  roomId: z.string().trim().min(1, "Room ID is required"),
  latestIncomingMessage: z.object({
    text: z
      .string()
      .trim()
      .min(1, "Latest incoming message cannot be empty")
      .max(
        CHAT_AI_CONTEXT_TEXT_MAX_LENGTH,
        "Latest incoming message is too long",
      ),
  }),
  recentMessages: chatAiRecentMessagesSchema,
});

export const smartRepliesResponseSchema = z.object({
  suggestions: z.array(z.string()).max(SMART_REPLIES_MAX_SUGGESTIONS),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ChatSendInput = z.infer<typeof chatSendSchema>;
export type FileUploadMetaInput = z.infer<typeof fileUploadMetaSchema>;
export type PredictTypingInput = z.infer<typeof predictTypingSchema>;
export type PredictTypingResponseInput = z.infer<
  typeof predictTypingResponseSchema
>;
export type SmartRepliesInput = z.infer<typeof smartRepliesSchema>;
export type SmartRepliesResponseInput = z.infer<
  typeof smartRepliesResponseSchema
>;

export function getFirstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
