import policy from "@/shared/file-policy.js";

export const FILE_MAX_BYTES_DEFAULT = policy.FILE_MAX_BYTES_DEFAULT;
export const FILE_MAX_BYTES_VIDEO = policy.FILE_MAX_BYTES_VIDEO;

export const ALLOWED_IMAGE_CONTENT_TYPES = policy.ALLOWED_IMAGE_CONTENT_TYPES;
export const ALLOWED_VIDEO_CONTENT_TYPES = policy.ALLOWED_VIDEO_CONTENT_TYPES;
export const ALLOWED_DOCUMENT_CONTENT_TYPES =
  policy.ALLOWED_DOCUMENT_CONTENT_TYPES;
export const ALLOWED_FILE_CONTENT_TYPES = policy.ALLOWED_FILE_CONTENT_TYPES;

export const FILE_CATEGORY = policy.FILE_CATEGORY;

export type FileCategory =
  (typeof FILE_CATEGORY)[keyof typeof FILE_CATEGORY];

export type AllowedFileContentType = string;

export function isAllowedFileContentType(contentType: string): boolean {
  return policy.isAllowedFileContentType(contentType);
}

export function getFileCategory(contentType: string): FileCategory | null {
  return policy.getFileCategory(contentType) as FileCategory | null;
}

export function getMaxBytesForContentType(contentType: string): number {
  return policy.getMaxBytesForContentType(contentType);
}

export function getFileSizeLimitLabel(contentType: string): string {
  return policy.getFileSizeLimitLabel(contentType);
}

export function acceptAttributeForFileInput(): string {
  return policy.acceptAttributeForFileInput();
}

export function sanitizeOriginalFileName(fileName: string): string {
  return policy.sanitizeOriginalFileName(fileName);
}

export function extensionForContentType(contentType: string): string {
  return policy.extensionForContentType(contentType);
}

export function isRoomMember(roomId: string, userEmail: string): boolean {
  return policy.isRoomMember(roomId, userEmail);
}

export function isMediaKeyForRoom(key: string, roomId: string): boolean {
  return policy.isMediaKeyForRoom(key, roomId);
}
