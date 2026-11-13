"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import {
  clearAuthSession,
  getAuthSession,
} from "@/features/auth/utils/session";
import { lookupUserByEmail } from "../api/client";
import type {
  ChatMessage,
  LookupUser,
  StoredMessage,
} from "../types/chat.types";
import { buildRoomId } from "../utils/buildRoomId";
import { mapStoredMessage } from "../utils/mapStoredMessage";
import { lookupEmailSchema } from "../utils/validation";
import { useChatSocket } from "./useChatSocket";

interface UseChatMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  joining: boolean;
  connected: boolean;
  activeRoomId: string | null;
  joinedPeer: LookupUser | null;
  error: string;
  sendMessage: (text: string) => Promise<void>;
  joinPeerRoom: (peerEmail: string) => Promise<void>;
}

export function useChatMessages(): UseChatMessagesResult {
  const router = useRouter();
  const routerRef = useRef(router);
  const currentUserIdRef = useRef<string | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinedPeer, setJoinedPeer] = useState<LookupUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    const session = getAuthSession();

    if (!session) {
      routerRef.current.replace(AUTH_ROUTES.login);
      return;
    }

    setToken(session.token);
    setCurrentUserId(session.user.id);
    setCurrentUserEmail(session.user.email);
    // Do not load global message history until a personal room is joined.
    setMessages([]);
    setLoading(false);
  }, []);

  const onSocketMessageRef = useRef((stored: StoredMessage) => {
    // Ignore live traffic until this client has joined a room.
    if (!activeRoomIdRef.current) {
      return;
    }

    const userId = currentUserIdRef.current;
    if (!userId) {
      return;
    }

    setMessages((current) => {
      if (current.some((message) => message.id === stored.id)) {
        return current;
      }

      return [...current, mapStoredMessage(stored, userId)];
    });
    setSending(false);
  });

  const onSocketErrorRef = useRef((message: string) => {
    setSending(false);
    setJoining(false);
    setError((current) => (current === message ? current : message));
  });

  const { connected, activeRoomId, sendChatMessage, joinRoom } = useChatSocket({
    token,
    enabled: Boolean(token),
    onMessage: onSocketMessageRef.current,
    onError: onSocketErrorRef.current,
  });

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  async function joinPeerRoom(peerEmail: string) {
    const session = getAuthSession();

    if (!session) {
      routerRef.current.replace(AUTH_ROUTES.login);
      return;
    }

    const parsed = lookupEmailSchema.safeParse(peerEmail);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }

    const normalizedPeer = parsed.data;
    const myEmail = (currentUserEmail ?? session.user.email).trim().toLowerCase();

    if (normalizedPeer === myEmail) {
      setError("You cannot start a personal chat with yourself");
      return;
    }

    if (!connected) {
      setError(
        "Live connection is not ready. Run the app with npm run dev:server (Socket.IO).",
      );
      return;
    }

    setError("");
    setJoining(true);

    try {
      const peer = await lookupUserByEmail(session.token, normalizedPeer);
      const roomId = buildRoomId(myEmail, peer.email);

      // Switching rooms starts a fresh local transcript (no global history leak).
      setMessages([]);
      setJoinedPeer(null);

      const joined = joinRoom(roomId);

      if (!joined) {
        setError(
          "Live connection is not ready. Run the app with npm run dev:server (Socket.IO).",
        );
        return;
      }

      setJoinedPeer(peer);
    } catch (joinError) {
      setJoinedPeer(null);
      const message =
        joinError instanceof Error
          ? joinError.message
          : "Could not join room";

      if (message === "Unauthorized") {
        clearAuthSession();
        routerRef.current.replace(AUTH_ROUTES.login);
        return;
      }

      setError(message);
    } finally {
      setJoining(false);
    }
  }

  async function sendMessage(text: string) {
    const session = getAuthSession();

    if (!session) {
      routerRef.current.replace(AUTH_ROUTES.login);
      return;
    }

    if (!activeRoomId) {
      setError("Join a room before sending messages");
      return;
    }

    setError("");
    setSending(true);

    const sent = sendChatMessage(text);

    if (!sent) {
      setSending(false);
      setError(
        "Live connection is not ready. Run the app with npm run dev:server (Socket.IO).",
      );
    }
  }

  return {
    messages,
    loading,
    sending,
    joining,
    connected,
    activeRoomId,
    joinedPeer,
    error,
    sendMessage,
    joinPeerRoom,
  };
}
