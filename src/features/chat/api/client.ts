import {
  PREDICTIVE_TYPING_TIMEOUT_MS,
  SMART_REPLIES_TIMEOUT_MS,
} from "../constants/chat.constants";
import type {
  CreateMessagePayload,
  FetchMessagesOptions,
  FileUploadResponse,
  LookupUser,
  LookupUserResponse,
  MessageErrorResponse,
  MessagesListResponse,
  PredictTypingRequest,
  PredictTypingResponse,
  SmartRepliesRequest,
  SmartRepliesResponse,
  StoredMessage,
} from "../types/chat.types";
import { isAbortError } from "../utils/isAbortError";
import {
  predictTypingResponseSchema,
  smartRepliesResponseSchema,
} from "../utils/validation";
import type { z } from "zod";

const EMPTY_PREDICT_RESPONSE: PredictTypingResponse = { suggestion: "" };
const CLIENT_PREDICT_TIMEOUT_MS = PREDICTIVE_TYPING_TIMEOUT_MS + 1000;

const EMPTY_SMART_REPLIES_RESPONSE: SmartRepliesResponse = { suggestions: [] };
const CLIENT_SMART_REPLIES_TIMEOUT_MS = SMART_REPLIES_TIMEOUT_MS + 1000;

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | MessageErrorResponse;

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Request failed";
    throw new Error(message);
  }

  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchMessages(
  token: string,
  options: FetchMessagesOptions,
): Promise<MessagesListResponse> {
  const params = new URLSearchParams({
    roomId: options.roomId,
  });

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }

  if (options.before && options.beforeId) {
    params.set("before", options.before);
    params.set("beforeId", options.beforeId);
  }

  const response = await fetch(`/api/messages?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  return parseJsonResponse<MessagesListResponse>(response);
}

export async function sendMessageRequest(
  token: string,
  payload: CreateMessagePayload,
): Promise<StoredMessage> {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse<{ message: StoredMessage }>(response);
  return data.message;
}

export async function lookupUserByEmail(
  token: string,
  email: string,
): Promise<LookupUser> {
  const params = new URLSearchParams({ email: email.trim() });
  const response = await fetch(`/api/users/by-email?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const data = await parseJsonResponse<LookupUserResponse>(response);
  return data.user;
}

export async function uploadChatFile(
  token: string,
  input: { roomId: string; file: File },
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.set("roomId", input.roomId);
  formData.set("file", input.file);

  const response = await fetch("/api/media/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseJsonResponse<FileUploadResponse>(response);
}

export async function fetchFileAccessUrl(
  token: string,
  input: { roomId: string; key: string },
): Promise<string> {
  const params = new URLSearchParams({
    roomId: input.roomId,
    key: input.key,
  });

  const response = await fetch(`/api/media/access?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const data = await parseJsonResponse<{ url: string }>(response);
  return data.url;
}

export async function deleteChatFileMessage(
  token: string,
  input: { roomId: string; messageId: string },
): Promise<void> {
  const params = new URLSearchParams({
    roomId: input.roomId,
    messageId: input.messageId,
  });

  const response = await fetch(`/api/media/delete?${params.toString()}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  await parseJsonResponse<{ ok: boolean }>(response);
}

/** Auth/membership failures that must not be soft-swallowed as empty AI results. */
export class ChatAiHttpError extends Error {
  readonly status: number;
  readonly feature: "predict" | "smart-replies";

  constructor(feature: "predict" | "smart-replies", status: number) {
    super(`Chat AI (${feature}) failed with status ${status}`);
    this.name = "ChatAiHttpError";
    this.feature = feature;
    this.status = status;
  }
}

export function isChatAiHttpError(error: unknown): error is ChatAiHttpError {
  return error instanceof ChatAiHttpError;
}

async function softFailAiPost<TSchema extends z.ZodType>(input: {
  feature: "predict" | "smart-replies";
  path: string;
  token: string;
  body: unknown;
  schema: TSchema;
  empty: z.infer<TSchema>;
  timeoutMs: number;
  signal?: AbortSignal;
}): Promise<z.infer<TSchema>> {
  if (input.signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  const timeoutSignal = AbortSignal.timeout(input.timeoutMs);
  const signal = input.signal
    ? AbortSignal.any([input.signal, timeoutSignal])
    : timeoutSignal;

  try {
    const response = await fetch(input.path, {
      method: "POST",
      headers: authHeaders(input.token),
      body: JSON.stringify(input.body),
      signal,
    });

    if (input.signal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ChatAiHttpError(input.feature, response.status);
      }
      return input.empty;
    }

    const data: unknown = await response.json();
    const parsed = input.schema.safeParse(data);
    if (!parsed.success) {
      return input.empty;
    }

    return parsed.data;
  } catch (error) {
    if (isChatAiHttpError(error)) {
      throw error;
    }

    if (input.signal?.aborted) {
      throw isAbortError(error)
        ? error
        : new DOMException("The operation was aborted.", "AbortError");
    }

    if (timeoutSignal.aborted) {
      return input.empty;
    }

    if (isAbortError(error)) {
      throw error;
    }

    return input.empty;
  }
}

/**
 * Predictive typing request.
 * - Caller abort → throws AbortError
 * - 401 / 403 → throws ChatAiHttpError (hook handles session / no-retry)
 * - Timeout / 429 / 5xx / other → `{ suggestion: "" }` (chat-safe)
 */
export async function predictTyping(
  token: string,
  request: PredictTypingRequest,
  options: { signal?: AbortSignal } = {},
): Promise<PredictTypingResponse> {
  return softFailAiPost({
    feature: "predict",
    path: "/api/chat/predict",
    token,
    body: {
      roomId: request.roomId,
      draft: request.draft,
      recentMessages: request.recentMessages ?? [],
    },
    schema: predictTypingResponseSchema,
    empty: EMPTY_PREDICT_RESPONSE,
    timeoutMs: CLIENT_PREDICT_TIMEOUT_MS,
    signal: options.signal,
  });
}

/**
 * Smart Replies request.
 * - Caller abort → throws AbortError
 * - 401 / 403 → throws ChatAiHttpError (hook handles session / no-retry)
 * - Timeout / 4xx/5xx / parse → `{ suggestions: [] }` (chat-safe)
 */
export async function fetchSmartReplies(
  token: string,
  request: SmartRepliesRequest,
  options: { signal?: AbortSignal } = {},
): Promise<SmartRepliesResponse> {
  return softFailAiPost({
    feature: "smart-replies",
    path: "/api/chat/smart-replies",
    token,
    body: {
      roomId: request.roomId,
      latestIncomingMessage: request.latestIncomingMessage,
      recentMessages: request.recentMessages ?? [],
    },
    schema: smartRepliesResponseSchema,
    empty: EMPTY_SMART_REPLIES_RESPONSE,
    timeoutMs: CLIENT_SMART_REPLIES_TIMEOUT_MS,
    signal: options.signal,
  });
}
