import type {
  CreateMessagePayload,
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
): Promise<StoredMessage[]> {
  const response = await fetch("/api/messages", {
    method: "GET",
    headers: authHeaders(token),
  });

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
