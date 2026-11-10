"use client";

import { useEffect, useRef, useState } from "react";
import {
  WS_EVENT,
  WS_RECONNECT_DELAY_MS,
} from "../constants/chat.constants";
import type { StoredMessage, WsServerEvent } from "../types/chat.types";
import { buildChatWebSocketUrl } from "../utils/wsUrl";

interface UseChatSocketOptions {
  token: string | null;
  enabled: boolean;
  onMessage: (message: StoredMessage) => void;
  onError?: (message: string) => void;
}

interface UseChatSocketResult {
  connected: boolean;
  sendChatMessage: (text: string) => boolean;
}

export function useChatSocket({
  token,
  enabled,
  onMessage,
  onError,
}: UseChatSocketOptions): UseChatSocketResult {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    let cancelled = false;

    function clearReconnectTimer() {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function connect() {
      if (cancelled) {
        return;
      }

      clearReconnectTimer();

      const socket = new WebSocket(buildChatWebSocketUrl(token as string));
      socketRef.current = socket;

      socket.onopen = () => {
        if (!cancelled) {
          setConnected(true);
        }
      };

      socket.onmessage = (event) => {
        let payload: WsServerEvent;

        try {
          payload = JSON.parse(String(event.data)) as WsServerEvent;
        } catch {
          onErrorRef.current?.("Received invalid live message");
          return;
        }

        if (payload.type === WS_EVENT.chatMessage) {
          onMessageRef.current(payload.message);
          return;
        }

        if (payload.type === WS_EVENT.error) {
          onErrorRef.current?.(payload.message);
        }
      };

      socket.onerror = () => {
        onErrorRef.current?.(
          "Live connection error. Use npm run dev:server for WebSockets.",
        );
      };

      socket.onclose = () => {
        setConnected(false);
        socketRef.current = null;

        if (cancelled) {
          return;
        }

        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, WS_RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      }
      setConnected(false);
    };
  }, [enabled, token]);

  function sendChatMessage(text: string): boolean {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(
      JSON.stringify({
        type: WS_EVENT.chatSend,
        text,
      }),
    );

    return true;
  }

  return {
    connected,
    sendChatMessage,
  };
}
