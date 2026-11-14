"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import {
  clearAuthSession,
  getAuthSession,
} from "@/features/auth/utils/session";
import { fetchSmartReplies, isChatAiHttpError } from "../api/client";
import type { ChatMessage } from "../types/chat.types";
import {
  buildChatAiContext,
  findLatestIncomingTextMessage,
} from "../utils/buildChatAiContext";
import { isAbortError } from "../utils/isAbortError";

export interface UseSmartRepliesOptions {
  messages: ChatMessage[];
  roomId: string | null;
  currentUserId: string | null;
  /** Client UI/feature toggle only — not authorization. */
  enabled?: boolean;
}

export interface UseSmartRepliesResult {
  suggestions: string[];
  isGenerating: boolean;
  /** True when a latest incoming text message exists to reply to. */
  hasIncomingTarget: boolean;
  clearSuggestions: () => void;
}

export function useSmartReplies({
  messages,
  roomId,
  currentUserId,
  enabled = true,
}: UseSmartRepliesOptions): UseSmartRepliesResult {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  /** Settled (success / empty / soft-fail) for this incoming id — blocks re-fetch. */
  const completedForIdRef = useRef<string | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const latestIncoming = useMemo(() => {
    if (!currentUserId) {
      return null;
    }
    return findLatestIncomingTextMessage(messages, currentUserId);
  }, [messages, currentUserId]);

  const latestIncomingId = latestIncoming?.id ?? null;
  const hasIncomingTarget = Boolean(
    enabled && roomId && currentUserId && latestIncoming,
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  useEffect(() => {
    if (!enabled || !roomId || !currentUserId || !latestIncomingId) {
      abortRef.current?.abort();
      abortRef.current = null;
      requestIdRef.current += 1;
      completedForIdRef.current = null;
      setSuggestions([]);
      setIsGenerating(false);
      return;
    }

    if (completedForIdRef.current === latestIncomingId) {
      return;
    }

    const incoming = findLatestIncomingTextMessage(
      messagesRef.current,
      currentUserId,
    );
    if (!incoming || incoming.id !== latestIncomingId) {
      return;
    }

    const session = getAuthSession();
    if (!session?.token) {
      setSuggestions([]);
      setIsGenerating(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setSuggestions([]);
    setIsGenerating(true);

    const latestText = incoming.text.replace(/\s+/g, " ").trim();
    const recentMessages = buildChatAiContext(
      messagesRef.current,
      currentUserId,
    );

    void fetchSmartReplies(
      session.token,
      {
        roomId,
        latestIncomingMessage: { text: latestText },
        recentMessages,
      },
      { signal: controller.signal },
    )
      .then((result) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        completedForIdRef.current = incoming.id;
        setSuggestions(result.suggestions);
        setIsGenerating(false);
      })
      .catch((error: unknown) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (isAbortError(error)) {
          return;
        }

        completedForIdRef.current = incoming.id;
        setSuggestions([]);
        setIsGenerating(false);

        if (isChatAiHttpError(error) && error.status === 401) {
          clearAuthSession();
          router.replace(AUTH_ROUTES.login);
        }
      });

    return () => {
      controller.abort();
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    };
  }, [enabled, roomId, currentUserId, latestIncomingId, router]);

  return {
    suggestions,
    isGenerating,
    hasIncomingTarget,
    clearSuggestions,
  };
}
