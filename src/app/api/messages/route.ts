import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import {
  createMessage,
  listMessages,
} from "@/features/chat/api/messages.service";
import { MESSAGE_TYPE } from "@/features/chat/constants/chat.constants";
import { isRoomMember } from "@/features/chat/utils/isRoomMember";
import {
  createMessageSchema,
  getFirstZodError,
} from "@/features/chat/utils/validation";
import { logger } from "@/services/logging/logger";
import {
  createSignedMediaUrl,
  isMediaKeyForRoom,
} from "@/services/storage/uploads";

export async function GET(request: Request) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId")?.trim() || undefined;

    if (!roomId) {
      return NextResponse.json(
        { message: "roomId is required" },
        { status: 400 },
      );
    }

    if (!isRoomMember(roomId, user.email)) {
      return NextResponse.json(
        { message: "You can only view messages in rooms you belong to" },
        { status: 403 },
      );
    }

    const rows = await listMessages(roomId);
    const messages = await Promise.all(
      rows.map(async (message) => {
        if (
          message.type !== MESSAGE_TYPE.media ||
          !message.mediaKey ||
          !isMediaKeyForRoom(message.mediaKey, roomId)
        ) {
          return message;
        }

        try {
          const mediaUrl = await createSignedMediaUrl(message.mediaKey);
          return { ...message, mediaUrl };
        } catch (error) {
          logger.error("Failed to sign media URL for message", {
            messageId: message.id,
            error: error instanceof Error ? error.message : "unknown",
          });
          return message;
        }
      }),
    );

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

    if (!isRoomMember(parsed.data.roomId, user.email)) {
      return NextResponse.json(
        { message: "You can only send messages in rooms you belong to" },
        { status: 403 },
      );
    }

    const message = await createMessage({
      text: parsed.data.text,
      roomId: parsed.data.roomId,
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
