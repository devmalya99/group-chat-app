import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import { findUserByEmail } from "@/features/chat/api/users.service";
import {
  getFirstZodError,
  lookupEmailSchema,
} from "@/features/chat/utils/validation";
import { logger } from "@/services/logging/logger";

export async function GET(request: Request) {
  try {
    const authUser = getAuthUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = lookupEmailSchema.safeParse(searchParams.get("email") ?? "");

    if (!parsed.success) {
      return NextResponse.json(
        { message: getFirstZodError(parsed.error) },
        { status: 400 },
      );
    }

    if (parsed.data === authUser.email.trim().toLowerCase()) {
      return NextResponse.json(
        { message: "You cannot start a personal chat with yourself" },
        { status: 400 },
      );
    }

    const user = await findUserByEmail(parsed.data);

    if (!user) {
      return NextResponse.json(
        { message: "No user found with that email" },
        { status: 404 },
      );
    }

    if (user.id === authUser.id) {
      return NextResponse.json(
        { message: "You cannot start a personal chat with yourself" },
        { status: 400 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    logger.error("Lookup user by email failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
