import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import {
  isMediaKeyForRoom,
  isRoomMember,
} from "@/features/chat/utils/filePolicy";
import { logger } from "@/services/logging/logger";
import { createSignedMediaUrl } from "@/services/storage/uploads";

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
        { message: "You can only access files in rooms you belong to" },
        { status: 403 },
      );
    }

    if (!isMediaKeyForRoom(key, roomId)) {
      return NextResponse.json(
        { message: "File does not belong to this room" },
        { status: 403 },
      );
    }

    const url = await createSignedMediaUrl(key);
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    logger.error("File access failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Could not access file. Please try again." },
      { status: 500 },
    );
  }
}
