import { NextResponse } from "next/server";
import {
  AuthUnauthorizedError,
  loginUser,
} from "@/features/auth/api/auth.service";
import {
  getFirstZodError,
  loginSchema,
} from "@/features/auth/utils/validation";
import { logger } from "@/services/logging/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: getFirstZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await loginUser(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthUnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    logger.error("Login failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
