import { randomUUID } from "crypto";
import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";
import { MEDIA_SIGNED_URL_EXPIRES_IN } from "@/features/chat/constants/chat.constants";
import {
  extensionForContentType,
  getFileCategory,
  isAllowedFileContentType,
  isMediaKeyForRoom,
  sanitizeOriginalFileName,
  type FileCategory,
} from "@/features/chat/utils/filePolicy";
import { logger } from "@/services/logging/logger";

const BUCKET = "uploads";

function getUploadsClient() {
  return new Files({ adapter: neon({ bucket: BUCKET }) });
}

export { isMediaKeyForRoom };

/** Object keys are scoped under the room so access stays namespaced. */
export function buildMediaObjectKey(
  roomId: string,
  contentType: string,
): string {
  const safeRoom = encodeURIComponent(roomId.trim().toLowerCase());
  const ext = extensionForContentType(contentType);
  return `rooms/${safeRoom}/${randomUUID()}.${ext}`;
}

export async function createSignedMediaUrl(key: string): Promise<string> {
  const files = getUploadsClient();
  return files.url(key, { expiresIn: MEDIA_SIGNED_URL_EXPIRES_IN });
}

export async function uploadChatFile(input: {
  roomId: string;
  contentType: string;
  originalFileName: string;
  body: Buffer | Uint8Array | Blob;
  fileSize: number;
}): Promise<{
  key: string;
  contentType: string;
  url: string;
  originalFileName: string;
  fileCategory: FileCategory;
  fileSize: number;
}> {
  if (!isAllowedFileContentType(input.contentType)) {
    throw new Error("Unsupported file content type");
  }

  const fileCategory = getFileCategory(input.contentType);
  if (!fileCategory) {
    throw new Error("Unsupported file content type");
  }

  const originalFileName = sanitizeOriginalFileName(input.originalFileName);
  const key = buildMediaObjectKey(input.roomId, input.contentType);
  const files = getUploadsClient();

  await files.upload(key, input.body, { contentType: input.contentType });
  const url = await files.url(key, { expiresIn: MEDIA_SIGNED_URL_EXPIRES_IN });

  logger.info("Chat file uploaded", {
    key,
    roomId: input.roomId,
    contentType: input.contentType,
    fileCategory,
    fileSize: input.fileSize,
  });

  return {
    key,
    contentType: input.contentType,
    url,
    originalFileName,
    fileCategory,
    fileSize: input.fileSize,
  };
}

/** Hard-delete an object from the private uploads bucket. */
export async function deleteChatFile(key: string): Promise<void> {
  const files = getUploadsClient();
  await files.delete(key);
  logger.info("Chat file deleted from storage", { key });
}
