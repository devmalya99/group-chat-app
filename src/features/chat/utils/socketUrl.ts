export function buildChatSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (configured) {
    return configured;
  }

  return window.location.origin;
}
