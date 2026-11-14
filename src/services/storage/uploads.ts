import { randomUUID } from "crypto";
import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";
import {
  MEDIA_SIGNED_URL_EXPIRES_IN,
} from "@/features/chat/constants/chat.constants";
import { logger } from "@/services/logging/logger";

const BUCKET = "uploads";

function getUploadsClient() {
  return new Files({ adapter: neon({ bucket: BUCKET }) });
}

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

/** Object keys are scoped under the room so listing/access stays namespaced. */
export function buildMediaObjectKey(
  roomId: string,
  contentType: string,
): string {
  const safeRoom = encodeURIComponent(roomId.trim().toLowerCase());
  const ext = extensionForContentType(contentType);
  return `rooms/${safeRoom}/${randomUUID()}.${ext}`;
}

export async function uploadChatImage(input: {
  roomId: string;
  contentType: string;
  body: Buffer | Uint8Array | Blob;
}): Promise<{ key: string; contentType: string; url: string }> {
  const key = buildMediaObjectKey(input.roomId, input.contentType);
  const files = getUploadsClient();

  await files.upload(key, input.body, { contentType: input.contentType });
  const url = await files.url(key, { expiresIn: MEDIA_SIGNED_URL_EXPIRES_IN });

  logger.info("Chat media uploaded", {
    key,
    roomId: input.roomId,
    contentType: input.contentType,
  });

  return { key, contentType: input.contentType, url };
}

export async function createSignedMediaUrl(key: string): Promise<string> {
  const files = getUploadsClient();
  return files.url(key, { expiresIn: MEDIA_SIGNED_URL_EXPIRES_IN });
}

export function isMediaKeyForRoom(key: string, roomId: string): boolean {
  const expectedPrefix = `rooms/${encodeURIComponent(roomId.trim().toLowerCase())}/`;
  return key.startsWith(expectedPrefix);
}
