import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MEDIA_MAX_BYTES,
} from "@/features/chat/constants/chat.constants";
import { isRoomMember } from "@/features/chat/utils/isRoomMember";
import {
  getFirstZodError,
  mediaUploadMetaSchema,
} from "@/features/chat/utils/validation";
import { logger } from "@/services/logging/logger";
import { uploadChatImage } from "@/services/storage/uploads";

export async function POST(request: Request) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const roomIdValue = formData.get("roomId");
    const fileValue = formData.get("file");

    const roomId =
      typeof roomIdValue === "string" ? roomIdValue.trim() : "";

    if (!roomId) {
      return NextResponse.json(
        { message: "Room ID is required" },
        { status: 400 },
      );
    }

    if (!isRoomMember(roomId, user.email)) {
      return NextResponse.json(
        { message: "You can only upload media to rooms you belong to" },
        { status: 403 },
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 },
      );
    }

    const contentType = fileValue.type;
    if (
      !ALLOWED_IMAGE_CONTENT_TYPES.includes(
        contentType as (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { message: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 },
      );
    }

    const meta = mediaUploadMetaSchema.safeParse({
      contentType,
      size: fileValue.size,
    });

    if (!meta.success) {
      return NextResponse.json(
        { message: getFirstZodError(meta.error) },
        { status: 400 },
      );
    }

    if (fileValue.size > MEDIA_MAX_BYTES) {
      return NextResponse.json(
        { message: "Image must be 5 MB or smaller" },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await fileValue.arrayBuffer());
    const uploaded = await uploadChatImage({
      roomId,
      contentType: meta.data.contentType,
      body: bytes,
    });

    return NextResponse.json(
      {
        key: uploaded.key,
        contentType: uploaded.contentType,
        url: uploaded.url,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Media upload failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Could not upload image. Please try again." },
      { status: 500 },
    );
  }
}
