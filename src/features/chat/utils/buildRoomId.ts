/**
 * Builds a deterministic personal-chat room ID from two user emails.
 * Emails are normalized and sorted so A→B and B→A resolve to the same room.
 */
export function buildRoomId(emailA: string, emailB: string): string {
  const normalized = [emailA, emailB]
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (normalized.length !== 2) {
    throw new Error("Two email addresses are required to build a room ID");
  }

  if (normalized[0] === normalized[1]) {
    throw new Error("Cannot build a room ID for the same email twice");
  }

  return [...normalized].sort().join(":");
}
