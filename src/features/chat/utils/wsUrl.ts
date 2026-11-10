import { WS_PATH } from "../constants/chat.constants";

export function buildChatWebSocketUrl(token: string): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();

  if (configured) {
    const url = new URL(configured);
    url.searchParams.set("token", token);
    return url.toString();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(`${protocol}//${window.location.host}${WS_PATH}`);
  url.searchParams.set("token", token);
  return url.toString();
}
