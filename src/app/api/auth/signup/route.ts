import { NextResponse } from "next/server";
import {
  AuthConflictError,
  signUpUser,
} from "@/features/auth/api/auth.service";
import {
  getFirstZodError,
  signUpSchema,
} from "@/features/auth/utils/validation";
import { logger } from "@/services/logging/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: getFirstZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await signUpUser(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AuthConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    logger.error("Signup failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
