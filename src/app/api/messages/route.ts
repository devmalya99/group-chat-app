import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import {
  createMessage,
  listMessages,
} from "@/features/chat/api/messages.service";
import {
  createMessageSchema,
  getFirstZodError,
} from "@/features/chat/utils/validation";
import { logger } from "@/services/logging/logger";

export async function GET(request: Request) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const messages = await listMessages();
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    logger.error("List messages failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: getFirstZodError(parsed.error) },
        { status: 400 },
      );
    }

    const message = await createMessage({
      text: parsed.data.text,
      senderId: user.id,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    logger.error("Create message failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
