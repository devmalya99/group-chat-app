import type {
  CreateMessagePayload,
  FileUploadResponse,
  LookupUser,
  LookupUserResponse,
  MessageErrorResponse,
  MessagesListResponse,
  StoredMessage,
} from "../types/chat.types";

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
  roomId?: string,
): Promise<StoredMessage[]> {
  const params = new URLSearchParams();
  if (roomId) {
    params.set("roomId", roomId);
  }

  const query = params.toString();
  const response = await fetch(
    query ? `/api/messages?${query}` : "/api/messages",
    {
      method: "GET",
      headers: authHeaders(token),
    },
  );

  const data = await parseJsonResponse<MessagesListResponse>(response);
  return data.messages;
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
