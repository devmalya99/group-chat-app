"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import {
  clearAuthSession,
  getAuthSession,
} from "@/features/auth/utils/session";
import { isChatAiHttpError, predictTyping } from "../api/client";
import {
  PREDICTIVE_TYPING_DEBOUNCE_MS,
  PREDICTIVE_TYPING_MIN_DRAFT_LENGTH,
} from "../constants/chat.constants";
import type { ChatMessage } from "../types/chat.types";
import { buildChatAiContext } from "../utils/buildChatAiContext";
import { isAbortError } from "../utils/isAbortError";

export interface UsePredictiveTypingOptions {
  draft: string;
  messages: ChatMessage[];
  roomId: string | null;
  currentUserId: string | null;
  enabled?: boolean;
}

export interface UsePredictiveTypingResult {
  suggestion: string;
  clearSuggestion: () => void;
  /** Returns current suggestion and clears it. Does not send. */
  acceptSuggestion: () => string;
}

function canPredict(draft: string): boolean {
  return draft.trim().length >= PREDICTIVE_TYPING_MIN_DRAFT_LENGTH;
}

export function usePredictiveTyping({
  draft,
  messages,
  roomId,
  currentUserId,
  enabled = true,
}: UsePredictiveTypingOptions): UsePredictiveTypingResult {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState("");

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const suggestionForDraftRef = useRef<string | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const clearSuggestion = useCallback(() => {
    setSuggestion("");
    suggestionForDraftRef.current = null;
  }, []);

  const acceptSuggestion = useCallback(() => {
    const accepted = suggestion;
    clearSuggestion();
    return accepted;
  }, [suggestion, clearSuggestion]);

  useEffect(() => {
    if (
      suggestionForDraftRef.current !== null &&
      draft !== suggestionForDraftRef.current
    ) {
      clearSuggestion();
    }

    abortRef.current?.abort();
    abortRef.current = null;

    if (!enabled || !roomId || !currentUserId || !canPredict(draft)) {
      requestIdRef.current += 1;
      clearSuggestion();
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timer = window.setTimeout(() => {
      const session = getAuthSession();
      if (!session?.token || !enabled || !roomId || !currentUserId) {
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      void predictTyping(
        session.token,
        {
          roomId,
          draft,
          recentMessages: buildChatAiContext(
            messagesRef.current,
            currentUserId,
          ),
        },
        { signal: controller.signal },
      )
        .then((result) => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setSuggestion(result.suggestion);
          suggestionForDraftRef.current = result.suggestion ? draft : null;
        })
        .catch((error: unknown) => {
          if (requestId !== requestIdRef.current) {
            return;
          }

          if (isAbortError(error)) {
            return;
          }

          clearSuggestion();

          if (isChatAiHttpError(error) && error.status === 401) {
            clearAuthSession();
            router.replace(AUTH_ROUTES.login);
          }
        });
    }, PREDICTIVE_TYPING_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [draft, enabled, roomId, currentUserId, clearSuggestion, router]);

  return {
    suggestion,
    clearSuggestion,
    acceptSuggestion,
  };
}
