"use client";

import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import {
  clearAuthSession,
  getAuthSession,
} from "@/features/auth/utils/session";
import {
  deleteChatFileMessage,
  fetchFileAccessUrl,
  uploadChatFile,
} from "../api/client";
import { MESSAGE_TYPE } from "../constants/chat.constants";
import type { ChatMessage, ChatSendPayload } from "../types/chat.types";
import {
  getFileSizeLimitLabel,
  getMaxBytesForContentType,
  isAllowedFileContentType,
} from "../utils/filePolicy";

interface UseChatFileSharingOptions {
  activeRoomId: string | null;
  messages: ChatMessage[];
  sendChatMessage: (payload: ChatSendPayload) => boolean;
  notifyFileDeleted: (messageId: string) => boolean;
  onMessagesChange: (
    updater: (current: ChatMessage[]) => ChatMessage[],
  ) => void;
  onUploadingChange: (uploading: boolean) => void;
  onError: (message: string) => void;
}

export function useChatFileSharing({
  activeRoomId,
  messages,
  sendChatMessage,
  notifyFileDeleted,
  onMessagesChange,
  onUploadingChange,
  onError,
}: UseChatFileSharingOptions) {
  const router = useRouter();

  async function sendFile(file: File) {
    const session = getAuthSession();

    if (!session) {
      router.replace(AUTH_ROUTES.login);
      return;
    }

    if (!activeRoomId) {
      onError("Join a room before sending files");
      return;
    }

    if (!isAllowedFileContentType(file.type)) {
      onError(
        "Unsupported file type. Allowed: images, MP4, PDF, TXT, DOC, DOCX",
      );
      return;
    }

    const maxBytes = getMaxBytesForContentType(file.type);
    if (file.size > maxBytes) {
      onError(`File must be ${getFileSizeLimitLabel(file.type)} or smaller`);
      return;
    }

    onError("");
    onUploadingChange(true);

    try {
      const uploaded = await uploadChatFile(session.token, {
        roomId: activeRoomId,
        file,
      });

      const sent = sendChatMessage({
        text: "",
        mediaKey: uploaded.key,
        mediaContentType: uploaded.contentType,
        originalFileName: uploaded.originalFileName,
      });

      if (!sent) {
        onUploadingChange(false);
        onError(
          "Live connection is not ready. Run the app with npm run dev:server (Socket.IO).",
        );
      }
    } catch (uploadError) {
      onUploadingChange(false);
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload file";

      if (message === "Unauthorized") {
        clearAuthSession();
        router.replace(AUTH_ROUTES.login);
        return;
      }

      onError(message);
    }
  }

  async function deleteFile(messageId: string) {
    const session = getAuthSession();

    if (!session) {
      router.replace(AUTH_ROUTES.login);
      return;
    }

    if (!activeRoomId) {
      onError("Join a room before deleting files");
      return;
    }

    const target = messages.find((message) => message.id === messageId);
    if (!target || target.type !== MESSAGE_TYPE.media) {
      onError("File not found");
      return;
    }

    if (target.senderId !== session.user.id) {
      onError("Only the uploader can delete this file");
      return;
    }

    onError("");

    try {
      await deleteChatFileMessage(session.token, {
        roomId: activeRoomId,
        messageId,
      });

      onMessagesChange((current) =>
        current.filter((message) => message.id !== messageId),
      );
      notifyFileDeleted(messageId);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete file";

      if (message === "Unauthorized") {
        clearAuthSession();
        router.replace(AUTH_ROUTES.login);
        return;
      }

      onError(message);
    }
  }

  async function resolveFileUrl(
    token: string,
    roomId: string,
    key: string,
  ): Promise<string | null> {
    try {
      return await fetchFileAccessUrl(token, { roomId, key });
    } catch {
      return null;
    }
  }

  return {
    sendFile,
    deleteFile,
    resolveFileUrl,
  };
}
