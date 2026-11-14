"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants/auth.constants";
import {
  clearAuthSession,
  getAuthSession,
} from "@/features/auth/utils/session";
import {
  fetchMessages,
  lookupUserByEmail,
  uploadChatMedia,
} from "../api/client";
import type {
  ChatMessage,
  LookupUser,
  StoredMessage,
} from "../types/chat.types";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MEDIA_MAX_BYTES,
} from "../constants/chat.constants";
import { buildRoomId } from "../utils/buildRoomId";
import { mapStoredMessage } from "../utils/mapStoredMessage";
import { lookupEmailSchema } from "../utils/validation";
import { useChatSocket } from "./useChatSocket";

interface UseChatMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  uploading: boolean;
  joining: boolean;
  connected: boolean;
  activeRoomId: string | null;
  joinedPeer: LookupUser | null;
  error: string;
  sendMessage: (text: string) => Promise<void>;
  sendImage: (file: File) => Promise<void>;
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
  const [uploading, setUploading] = useState(false);
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
    setMessages([]);
    setLoading(false);
  }, []);

  const onSocketMessageRef = useRef((stored: StoredMessage) => {
    if (!activeRoomIdRef.current) {
      return;
    }

    if (stored.roomId && stored.roomId !== activeRoomIdRef.current) {
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
    setUploading(false);
  });

  const onSocketErrorRef = useRef((message: string) => {
    setSending(false);
    setUploading(false);
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

  useEffect(() => {
    if (!token || !activeRoomId || !currentUserId) {
      return;
    }

    let cancelled = false;

    async function loadRoomHistory() {
      try {
        const history = await fetchMessages(token!, activeRoomId!);
        if (cancelled) {
          return;
        }

        setMessages(
          history.map((message) => mapStoredMessage(message, currentUserId!)),
        );
      } catch (historyError) {
        if (cancelled) {
          return;
        }

        const message =
          historyError instanceof Error
            ? historyError.message
            : "Could not load room messages";

        if (message === "Unauthorized") {
          clearAuthSession();
          routerRef.current.replace(AUTH_ROUTES.login);
          return;
        }

        setError(message);
      }
    }

    void loadRoomHistory();

    return () => {
      cancelled = true;
    };
  }, [token, activeRoomId, currentUserId]);

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
      const peerEmailNormalized = peer.email.trim().toLowerCase();

      if (peer.id === session.user.id || peerEmailNormalized === myEmail) {
        setError("You cannot start a personal chat with yourself");
        return;
      }

      const roomId = buildRoomId(myEmail, peerEmailNormalized);

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

    const sent = sendChatMessage({ text });

    if (!sent) {
      setSending(false);
      setError(
        "Live connection is not ready. Run the app with npm run dev:server (Socket.IO).",
      );
    }
  }

  async function sendImage(file: File) {
    const session = getAuthSession();

    if (!session) {
      routerRef.current.replace(AUTH_ROUTES.login);
      return;
    }

    if (!activeRoomId) {
      setError("Join a room before sending images");
      return;
    }

    if (
      !ALLOWED_IMAGE_CONTENT_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number],
      )
    ) {
      setError("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }

    if (file.size > MEDIA_MAX_BYTES) {
      setError("Image must be 5 MB or smaller");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const uploaded = await uploadChatMedia(session.token, {
        roomId: activeRoomId,
        file,
      });

      const sent = sendChatMessage({
        text: "",
        mediaKey: uploaded.key,
        mediaContentType: uploaded.contentType,
        mediaUrl: uploaded.url,
      });

      if (!sent) {
        setUploading(false);
        setError(
          "Live connection is not ready. Run the app with npm run dev:server (Socket.IO).",
        );
      }
    } catch (uploadError) {
      setUploading(false);
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload image";

      if (message === "Unauthorized") {
        clearAuthSession();
        routerRef.current.replace(AUTH_ROUTES.login);
        return;
      }

      setError(message);
    }
  }

  return {
    messages,
    loading,
    sending,
    uploading,
    joining,
    connected,
    activeRoomId,
    joinedPeer,
    error,
    sendMessage,
    sendImage,
    joinPeerRoom,
  };
}
