import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import {
  deleteMessageById,
  getMessageInRoom,
} from "@/features/chat/api/messages.service";
import { MESSAGE_TYPE } from "@/features/chat/constants/chat.constants";
import {
  isMediaKeyForRoom,
  isRoomMember,
} from "@/features/chat/utils/filePolicy";
import { logger } from "@/services/logging/logger";
import { deleteChatFile } from "@/services/storage/uploads";

/**
 * Hard-delete a file message: DB row first, then Neon object.
 * Only the original uploader (and room member) may delete.
 */
export async function DELETE(request: Request) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId")?.trim() ?? "";
    const messageId = searchParams.get("messageId")?.trim() ?? "";

    if (!roomId || !messageId) {
      return NextResponse.json(
        { message: "roomId and messageId are required" },
        { status: 400 },
      );
    }

    if (!isRoomMember(roomId, user.email)) {
      return NextResponse.json(
        { message: "You can only delete files in rooms you belong to" },
        { status: 403 },
      );
    }

    const message = await getMessageInRoom({ messageId, roomId });

    if (!message || message.type !== MESSAGE_TYPE.media || !message.mediaKey) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    if (message.senderId !== user.id) {
      return NextResponse.json(
        { message: "Only the uploader can delete this file" },
        { status: 403 },
      );
    }

    if (!isMediaKeyForRoom(message.mediaKey, roomId)) {
      return NextResponse.json(
        { message: "File does not belong to this room" },
        { status: 403 },
      );
    }

    const storageKey = message.mediaKey;
    await deleteMessageById(message.id);

    try {
      await deleteChatFile(storageKey);
    } catch (storageError) {
      logger.error("Message deleted but storage cleanup failed", {
        messageId,
        key: storageKey,
        error:
          storageError instanceof Error ? storageError.message : "unknown",
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    logger.error("File delete failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Could not delete file. Please try again." },
      { status: 500 },
    );
  }
}
