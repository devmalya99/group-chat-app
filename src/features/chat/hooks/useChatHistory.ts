"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMessages } from "../api/client";
import type { ChatMessage } from "../types/chat.types";
import { mapStoredMessage } from "../utils/mapStoredMessage";

export type HistoryScrollReason = "replace" | "prepend" | "append";

interface UseChatHistoryOptions {
  token: string | null;
  roomId: string | null;
  currentUserId: string | null;
  onUnauthorized: () => void;
  onError: (message: string) => void;
}

interface UseChatHistoryResult {
  messages: ChatMessage[];
  hasMore: boolean;
  loadingMore: boolean;
  scrollReason: HistoryScrollReason | null;
  clearScrollReason: () => void;
  setMessages: (
    updater: (current: ChatMessage[]) => ChatMessage[],
  ) => void;
  appendMessage: (message: ChatMessage) => void;
  removeMessage: (messageId: string) => void;
  reset: () => void;
  loadOlderMessages: () => Promise<void>;
}

function handleAuthError(
  message: string,
  onUnauthorized: () => void,
): boolean {
  if (message !== "Unauthorized") {
    return false;
  }
  onUnauthorized();
  return true;
}

export function useChatHistory({
  token,
  roomId,
  currentUserId,
  onUnauthorized,
  onError,
}: UseChatHistoryOptions): UseChatHistoryResult {
  const [messages, setMessagesState] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollReason, setScrollReason] = useState<HistoryScrollReason | null>(
    null,
  );

  const messagesRef = useRef<ChatMessage[]>([]);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const roomIdRef = useRef(roomId);
  const requestIdRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const clearScrollReason = useCallback(() => {
    setScrollReason(null);
  }, []);

  const setMessages = useCallback(
    (updater: (current: ChatMessage[]) => ChatMessage[]) => {
      setMessagesState(updater);
    },
    [],
  );

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessagesState((current) => {
      if (current.some((item) => item.id === message.id)) {
        return current;
      }
      return [...current, message];
    });
    setScrollReason("append");
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessagesState((current) =>
      current.filter((message) => message.id !== messageId),
    );
  }, []);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setHasMore(false);
    setMessagesState([]);
    setScrollReason(null);
  }, []);

  useEffect(() => {
    if (!token || !roomId || !currentUserId) {
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    async function loadInitial() {
      loadingMoreRef.current = false;
      setLoadingMore(false);
      setHasMore(false);
      setMessagesState([]);
      setScrollReason(null);

      try {
        const history = await fetchMessages(token!, { roomId: roomId! });
        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }

        setMessagesState(
          history.messages.map((message) =>
            mapStoredMessage(message, currentUserId!),
          ),
        );
        setHasMore(history.hasMore);
        setScrollReason("replace");
      } catch (historyError) {
        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }

        const message =
          historyError instanceof Error
            ? historyError.message
            : "Could not load room messages";

        if (handleAuthError(message, onUnauthorized)) {
          return;
        }

        onError(message);
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [token, roomId, currentUserId, onUnauthorized, onError]);

  const loadOlderMessages = useCallback(async () => {
    const sessionToken = token;
    const activeRoomId = roomIdRef.current;
    const userId = currentUserId;
    const currentMessages = messagesRef.current;
    const requestId = requestIdRef.current;

    if (
      !sessionToken ||
      !activeRoomId ||
      !userId ||
      !hasMoreRef.current ||
      loadingMoreRef.current ||
      currentMessages.length === 0
    ) {
      return;
    }

    const oldest = currentMessages[0];
    if (!oldest) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const history = await fetchMessages(sessionToken, {
        roomId: activeRoomId,
        before: oldest.sentAt,
        beforeId: oldest.id,
      });

      if (
        requestId !== requestIdRef.current ||
        roomIdRef.current !== activeRoomId
      ) {
        return;
      }

      const existingIds = new Set(currentMessages.map((message) => message.id));
      const older = history.messages
        .map((message) => mapStoredMessage(message, userId))
        .filter((message) => !existingIds.has(message.id));

      if (older.length === 0) {
        setHasMore(false);
        return;
      }

      setMessagesState((current) => [...older, ...current]);
      setHasMore(history.hasMore);
      setScrollReason("prepend");
    } catch (historyError) {
      if (
        requestId !== requestIdRef.current ||
        roomIdRef.current !== activeRoomId
      ) {
        return;
      }

      const message =
        historyError instanceof Error
          ? historyError.message
          : "Could not load older messages";

      if (handleAuthError(message, onUnauthorized)) {
        return;
      }

      onError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [token, currentUserId, onUnauthorized, onError]);

  return {
    messages,
    hasMore,
    loadingMore,
    scrollReason,
    clearScrollReason,
    setMessages,
    appendMessage,
    removeMessage,
    reset,
    loadOlderMessages,
  };
}
