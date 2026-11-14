/**
 * Personal rooms are `emailA:emailB` (sorted). Membership means the
 * authenticated user's email is one of the two participants.
 */
export function isRoomMember(roomId: string, userEmail: string): boolean {
  const normalizedEmail = userEmail.trim().toLowerCase();
  if (!normalizedEmail || !roomId.trim()) {
    return false;
  }

  const participants = roomId
    .split(":")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  return participants.includes(normalizedEmail);
}
