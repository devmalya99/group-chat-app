import type {
  AuthErrorResponse,
  AuthSuccessResponse,
  LoginPayload,
  SignUpPayload,
} from "../types/auth.types";

async function parseAuthResponse(
  response: Response,
): Promise<AuthSuccessResponse> {
  const data = (await response.json()) as AuthSuccessResponse | AuthErrorResponse;

  if (!response.ok) {
    const message =
      "message" in data && typeof data.message === "string"
        ? data.message
        : "Request failed";
    throw new Error(message);
  }

  return data as AuthSuccessResponse;
}

export async function signUpRequest(
  payload: SignUpPayload,
): Promise<AuthSuccessResponse> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseAuthResponse(response);
}

export async function loginRequest(
  payload: LoginPayload,
): Promise<AuthSuccessResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseAuthResponse(response);
}
