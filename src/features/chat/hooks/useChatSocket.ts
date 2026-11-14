"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getAuthSession } from "@/features/auth/utils/session";
import { SOCKET_EVENT, SOCKET_PATH } from "../constants/chat.constants";
import type {
  ChatErrorPayload,
  ChatMessagePayload,
  ChatSendPayload,
  JoinRoomPayload,
  RoomJoinedPayload,
  StoredMessage,
} from "../types/chat.types";
import { buildChatSocketUrl } from "../utils/socketUrl";

interface UseChatSocketOptions {
  token: string | null;
  enabled: boolean;
  onMessage: (message: StoredMessage) => void;
  onError?: (message: string) => void;
}

interface UseChatSocketResult {
  connected: boolean;
  activeRoomId: string | null;
  sendChatMessage: (payload: ChatSendPayload) => boolean;
  joinRoom: (roomId: string) => boolean;
}

export function useChatSocket({
  token,
  enabled,
  onMessage,
  onError,
}: UseChatSocketOptions): UseChatSocketResult {
  const [connected, setConnected] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled || !token) {
      return;
    }

    const handshakeToken = token || getAuthSession()?.token || null;

    if (!handshakeToken) {
      onErrorRef.current?.("Authorization token is missing");
      return;
    }

    const socket = io(buildChatSocketUrl(), {
      path: SOCKET_PATH,
      auth: {
        token: handshakeToken,
      },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setActiveRoomId(null);
    });

    socket.on("connect_error", (error) => {
      setConnected(false);
      setActiveRoomId(null);
      const message =
        error?.message && error.message !== "xhr poll error"
          ? error.message
          : "Live connection error. Use npm run dev:server for Socket.IO.";
      onErrorRef.current?.(message);
    });

    socket.on(SOCKET_EVENT.chatMessage, (payload: ChatMessagePayload) => {
      if (!payload?.message) {
        return;
      }
      onMessageRef.current(payload.message);
    });

    socket.on(SOCKET_EVENT.roomJoined, (payload: RoomJoinedPayload) => {
      if (!payload?.roomId) {
        return;
      }
      setActiveRoomId(payload.roomId);
    });

    socket.on(SOCKET_EVENT.chatError, (payload: ChatErrorPayload) => {
      onErrorRef.current?.(payload?.message || "Live chat error");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setActiveRoomId(null);
    };
  }, [enabled, token]);

  function sendChatMessage(payload: ChatSendPayload): boolean {
    const socket = socketRef.current;

    if (!socket || !socket.connected || !activeRoomId) {
      return false;
    }

    socket.emit(SOCKET_EVENT.chatSend, payload);
    return true;
  }

  function joinRoom(roomId: string): boolean {
    const socket = socketRef.current;
    const trimmed = roomId.trim();

    if (!socket || !socket.connected || !trimmed) {
      return false;
    }

    const joinPayload: JoinRoomPayload = { roomId: trimmed };
    socket.emit(SOCKET_EVENT.joinRoom, joinPayload);
    return true;
  }

  return {
    connected,
    activeRoomId,
    sendChatMessage,
    joinRoom,
  };
}
