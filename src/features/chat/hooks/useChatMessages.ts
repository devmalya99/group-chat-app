"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import {
  clearAuthSession,
  getAuthSession,
} from "@/features/auth/utils/session";
import { fetchMessages } from "../api/client";
import type { ChatMessage, StoredMessage } from "../types/chat.types";
import { mapStoredMessage } from "../utils/mapStoredMessage";
import { useChatSocket } from "./useChatSocket";

interface UseChatMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  connected: boolean;
  error: string;
  sendMessage: (text: string) => Promise<void>;
}

export function useChatMessages(): UseChatMessagesResult {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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

      setToken(session.token);
      setCurrentUserId(session.user.id);
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

  function handleLiveMessage(stored: StoredMessage) {
    if (!currentUserId) {
      return;
    }

    setMessages((current) => {
      if (current.some((message) => message.id === stored.id)) {
        return current;
      }

      return [...current, mapStoredMessage(stored, currentUserId)];
    });
    setSending(false);
  }

  const { connected, sendChatMessage } = useChatSocket({
    token,
    enabled: Boolean(token) && !loading,
    onMessage: handleLiveMessage,
    onError: (message) => {
      setSending(false);
      setError(message);
    },
  });

  async function sendMessage(text: string) {
    const session = getAuthSession();

    if (!session) {
      router.replace(AUTH_ROUTES.login);
      return;
    }

    setError("");
    setSending(true);

    const sent = sendChatMessage(text);

    if (!sent) {
      setSending(false);
      setError(
        "Live connection is not ready. Run the app with npm run dev:server.",
      );
    }
  }

  return {
    messages,
    loading,
    sending,
    connected,
    error,
    sendMessage,
  };
}
