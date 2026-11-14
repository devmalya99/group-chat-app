"use strict";

const FILE_MAX_BYTES_DEFAULT = 5 * 1024 * 1024;
const FILE_MAX_BYTES_VIDEO = 10 * 1024 * 1024;

const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_VIDEO_CONTENT_TYPES = ["video/mp4"];

const ALLOWED_DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_FILE_CONTENT_TYPES = [
  ...ALLOWED_IMAGE_CONTENT_TYPES,
  ...ALLOWED_VIDEO_CONTENT_TYPES,
  ...ALLOWED_DOCUMENT_CONTENT_TYPES,
];

const FILE_CATEGORY = {
  image: "image",
  video: "video",
  document: "document",
};

const EXT_BY_CONTENT_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

function isAllowedFileContentType(contentType) {
  return ALLOWED_FILE_CONTENT_TYPES.includes(contentType);
}

function getFileCategory(contentType) {
  if (ALLOWED_IMAGE_CONTENT_TYPES.includes(contentType)) {
    return FILE_CATEGORY.image;
  }
  if (ALLOWED_VIDEO_CONTENT_TYPES.includes(contentType)) {
    return FILE_CATEGORY.video;
  }
  if (ALLOWED_DOCUMENT_CONTENT_TYPES.includes(contentType)) {
    return FILE_CATEGORY.document;
  }
  return null;
}

function getMaxBytesForContentType(contentType) {
  if (getFileCategory(contentType) === FILE_CATEGORY.video) {
    return FILE_MAX_BYTES_VIDEO;
  }
  return FILE_MAX_BYTES_DEFAULT;
}

function getFileSizeLimitLabel(contentType) {
  return `${getMaxBytesForContentType(contentType) / (1024 * 1024)} MB`;
}

function acceptAttributeForFileInput() {
  return ALLOWED_FILE_CONTENT_TYPES.join(",");
}

function sanitizeOriginalFileName(fileName) {
  if (typeof fileName !== "string") {
    return "file";
  }
  const trimmed = fileName.trim().replace(/[/\\]/g, "_");
  const withoutControl = trimmed.replace(/[\u0000-\u001f\u007f]/g, "");
  return withoutControl.slice(0, 255) || "file";
}

function extensionForContentType(contentType) {
  return EXT_BY_CONTENT_TYPE[contentType] || "bin";
}

function isRoomMember(roomId, userEmail) {
  const normalizedEmail =
    typeof userEmail === "string" ? userEmail.trim().toLowerCase() : "";
  if (!normalizedEmail || !roomId) {
    return false;
  }

  const participants = String(roomId)
    .split(":")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  return participants.includes(normalizedEmail);
}

function isMediaKeyForRoom(key, roomId) {
  const expectedPrefix = `rooms/${encodeURIComponent(String(roomId).trim().toLowerCase())}/`;
  return typeof key === "string" && key.startsWith(expectedPrefix);
}

module.exports = {
  FILE_MAX_BYTES_DEFAULT,
  FILE_MAX_BYTES_VIDEO,
  ALLOWED_IMAGE_CONTENT_TYPES,
  ALLOWED_VIDEO_CONTENT_TYPES,
  ALLOWED_DOCUMENT_CONTENT_TYPES,
  ALLOWED_FILE_CONTENT_TYPES,
  FILE_CATEGORY,
  isAllowedFileContentType,
  getFileCategory,
  getMaxBytesForContentType,
  getFileSizeLimitLabel,
  acceptAttributeForFileInput,
  sanitizeOriginalFileName,
  extensionForContentType,
  isRoomMember,
  isMediaKeyForRoom,
};
