import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import { isRoomMember } from "@/features/chat/utils/isRoomMember";
import {
  fileUploadMetaSchema,
  getFirstZodError,
} from "@/features/chat/utils/validation";
import { logger } from "@/services/logging/logger";
import { uploadChatFile } from "@/services/storage/uploads";

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
        { message: "You can only upload files to rooms you belong to" },
        { status: 403 },
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 },
      );
    }

    const meta = fileUploadMetaSchema.safeParse({
      contentType: fileValue.type,
      size: fileValue.size,
      originalFileName: fileValue.name,
    });

    if (!meta.success) {
      return NextResponse.json(
        { message: getFirstZodError(meta.error) },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await fileValue.arrayBuffer());
    const uploaded = await uploadChatFile({
      roomId,
      contentType: meta.data.contentType,
      originalFileName: meta.data.originalFileName ?? fileValue.name,
      body: bytes,
      fileSize: meta.data.size,
    });

    return NextResponse.json(
      {
        key: uploaded.key,
        contentType: uploaded.contentType,
        url: uploaded.url,
        originalFileName: uploaded.originalFileName,
        fileCategory: uploaded.fileCategory,
        fileSize: uploaded.fileSize,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("File upload failed", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { message: "Could not upload file. Please try again." },
      { status: 500 },
    );
  }
}
