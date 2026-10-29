import type { AuthUser } from "../types/auth.types";
import { verifyAuthToken } from "./token";

export function getAuthUserFromRequest(request: Request): AuthUser | null {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}
