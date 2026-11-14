export const FILE_MAX_BYTES_DEFAULT: number;
export const FILE_MAX_BYTES_VIDEO: number;
export const ALLOWED_IMAGE_CONTENT_TYPES: string[];
export const ALLOWED_VIDEO_CONTENT_TYPES: string[];
export const ALLOWED_DOCUMENT_CONTENT_TYPES: string[];
export const ALLOWED_FILE_CONTENT_TYPES: string[];
export const FILE_CATEGORY: {
  image: "image";
  video: "video";
  document: "document";
};

export function isAllowedFileContentType(contentType: string): boolean;
export function getFileCategory(contentType: string): string | null;
export function getMaxBytesForContentType(contentType: string): number;
export function getFileSizeLimitLabel(contentType: string): string;
export function acceptAttributeForFileInput(): string;
export function sanitizeOriginalFileName(fileName: string): string;
export function extensionForContentType(contentType: string): string;
export function isRoomMember(roomId: string, userEmail: string): boolean;
export function isMediaKeyForRoom(key: string, roomId: string): boolean;
