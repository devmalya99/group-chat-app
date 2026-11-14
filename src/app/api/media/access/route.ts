import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import { isRoomMember } from "@/features/chat/utils/isRoomMember";
import { logger } from "@/services/logging/logger";
import {
  createSignedMediaUrl,
  isMediaKeyForRoom,
} from "@/services/storage/uploads";

/**
 * Issues a short-lived signed URL only when the caller is an authenticated
 * member of the room that owns the object key.
 */
export async function GET(request: Request) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId")?.trim() ?? "";
    const key = searchParams.get("key")?.trim() ?? "";

    if (!roomId || !key) {
      return NextResponse.json(
        { message: "roomId and key are required" },
        { status: 400 },
      );
    }

    if (!isRoomMember(roomId, user.email)) {
      return NextResponse.json(
        { message: "You can only view media in rooms you belong to" },
        { status: 403 },
      );
    }

    if (!isMediaKeyForRoom(key, roomId)) {
      return NextResponse.json(
        { message: "Media does not belong to this room" },
        { status: 403 },
      );
    }

    const url = await createSignedMediaUrl(key);
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    logger.error("Media access failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Could not access media. Please try again." },
      { status: 500 },
    );
  }
}
