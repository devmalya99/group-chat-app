import { eq, or } from "drizzle-orm";
import { db } from "@/services/db";
import { users } from "@/services/db/schema";
import { logger } from "@/services/logging/logger";
import type { AuthSuccessResponse, LoginPayload, SignUpPayload } from "../types/auth.types";
import { toAuthUser } from "../utils/map-user";
import { hashPassword, verifyPassword } from "../utils/password";
import { createAuthToken } from "../utils/token";

export class AuthConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConflictError";
  }
}

export class AuthUnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthUnauthorizedError";
  }
}

export async function signUpUser(
  payload: SignUpPayload,
): Promise<AuthSuccessResponse> {
  const existing = await db.query.users.findFirst({
    where: or(
      eq(users.email, payload.email),
      eq(users.phone, payload.phone),
    ),
  });

  if (existing) {
    if (existing.email === payload.email) {
      throw new AuthConflictError("An account with this email already exists");
    }
    throw new AuthConflictError("An account with this phone number already exists");
  }

  const passwordHash = await hashPassword(payload.password);

  const [created] = await db
    .insert(users)
    .values({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      passwordHash,
    })
    .returning();

  if (!created) {
    logger.error("Signup insert returned no row");
    throw new Error("Could not create account");
  }

  const user = toAuthUser(created);
  const token = createAuthToken(user);

  logger.info("User signed up", { userId: user.id });

  return { token, user };
}

export async function loginUser(
  payload: LoginPayload,
): Promise<AuthSuccessResponse> {
  const identifier = payload.identifier.trim().toLowerCase();
  const looksLikeEmail = identifier.includes("@");

  const found = await db.query.users.findFirst({
    where: looksLikeEmail
      ? eq(users.email, identifier)
      : or(eq(users.phone, payload.identifier.trim()), eq(users.email, identifier)),
  });

  if (!found) {
    throw new AuthUnauthorizedError("Invalid email/phone or password");
  }

  const isValid = await verifyPassword(payload.password, found.passwordHash);

  if (!isValid) {
    throw new AuthUnauthorizedError("Invalid email/phone or password");
  }

  const user = toAuthUser(found);
  const token = createAuthToken(user);

  logger.info("User logged in", { userId: user.id });

  return { token, user };
}
