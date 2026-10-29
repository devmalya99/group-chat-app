"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import {
  clearAuthSession,
  getAuthSession,
} from "@/features/auth/utils/session";
import { fetchMessages, sendMessageRequest } from "../api/client";
import type { ChatMessage } from "../types/chat.types";
import { mapStoredMessage } from "../utils/mapStoredMessage";

interface UseChatMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string;
  sendMessage: (text: string) => Promise<void>;
}

export function useChatMessages(): UseChatMessagesResult {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      const session = getAuthSession();

      if (!session) {
        router.replace(AUTH_ROUTES.login);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const stored = await fetchMessages(session.token);

        if (cancelled) {
          return;
        }

        setMessages(
          stored.map((message) =>
            mapStoredMessage(message, session.user.id),
          ),
        );
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Could not load messages";

        if (message === "Unauthorized") {
          clearAuthSession();
          router.replace(AUTH_ROUTES.login);
          return;
        }

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function sendMessage(text: string) {
    const session = getAuthSession();

    if (!session) {
      router.replace(AUTH_ROUTES.login);
      return;
    }

    setSending(true);
    setError("");

    try {
      const stored = await sendMessageRequest(session.token, { text });
      setMessages((current) => [
        ...current,
        mapStoredMessage(stored, session.user.id),
      ]);
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : "Could not send message";

      if (message === "Unauthorized") {
        clearAuthSession();
        router.replace(AUTH_ROUTES.login);
        return;
      }

      setError(message);
    } finally {
      setSending(false);
    }
  }

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
  };
}
