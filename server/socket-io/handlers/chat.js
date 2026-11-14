const { neon } = require("@neondatabase/serverless");

const MESSAGE_TEXT_MAX_LENGTH = 2000;
const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const SOCKET_EVENT = {
  chatSend: "chat:send",
  chatMessage: "chat:message",
  chatError: "chat:error",
  joinRoom: "join_room",
  roomJoined: "room:joined",
};

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(databaseUrl);
}

function isRoomMember(roomId, userEmail) {
  const normalizedEmail =
    typeof userEmail === "string" ? userEmail.trim().toLowerCase() : "";
  if (!normalizedEmail || !roomId) {
    return false;
  }

  const participants = roomId
    .split(":")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  return participants.includes(normalizedEmail);
}

function isMediaKeyForRoom(key, roomId) {
  const expectedPrefix = `rooms/${encodeURIComponent(roomId.trim().toLowerCase())}/`;
  return typeof key === "string" && key.startsWith(expectedPrefix);
}

async function createMessage({
  text,
  senderId,
  roomId,
  type,
  mediaKey,
  mediaContentType,
}) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO messages (text, sender_id, room_id, type, media_key, media_content_type)
    VALUES (
      ${text},
      ${senderId},
      ${roomId},
      ${type},
      ${mediaKey},
      ${mediaContentType}
    )
    RETURNING
      id,
      text,
      sender_id,
      room_id,
      type,
      media_key,
      media_content_type,
      created_at
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("Could not save message");
  }

  return {
    id: row.id,
    text: row.text,
    senderId: row.sender_id,
    roomId: row.room_id,
    type: row.type,
    mediaKey: row.media_key,
    mediaContentType: row.media_content_type,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function registerChatHandlers(io, socket) {
  socket.data.activeRoomId = null;

  socket.on(SOCKET_EVENT.joinRoom, (payload = {}) => {
    const roomId =
      typeof payload.roomId === "string" ? payload.roomId.trim() : "";

    if (!roomId) {
      socket.emit(SOCKET_EVENT.chatError, {
        message: "Room ID is required",
      });
      return;
    }

    const participants = roomId
      .split(":")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);

    if (participants.length !== 2 || participants[0] === participants[1]) {
      socket.emit(SOCKET_EVENT.chatError, {
        message: "You cannot start a personal chat with yourself",
      });
      return;
    }

    const myEmail =
      typeof socket.data.user?.email === "string"
        ? socket.data.user.email.trim().toLowerCase()
        : "";

    if (!myEmail || !participants.includes(myEmail)) {
      socket.emit(SOCKET_EVENT.chatError, {
        message: "You can only join rooms that include your account",
      });
      return;
    }

    const previousRoomId = socket.data.activeRoomId;
    if (previousRoomId && previousRoomId !== roomId) {
      socket.leave(previousRoomId);
    }

    socket.join(roomId);
    socket.data.activeRoomId = roomId;
    socket.emit(SOCKET_EVENT.roomJoined, { roomId });
  });

  socket.on(SOCKET_EVENT.chatSend, async (payload = {}) => {
    const roomId =
      typeof socket.data.activeRoomId === "string"
        ? socket.data.activeRoomId
        : "";

    if (!roomId) {
      socket.emit(SOCKET_EVENT.chatError, {
        message: "Join a room before sending messages",
      });
      return;
    }

    if (!isRoomMember(roomId, socket.data.user?.email)) {
      socket.emit(SOCKET_EVENT.chatError, {
        message: "You can only send messages in rooms you belong to",
      });
      return;
    }

    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    const mediaKey =
      typeof payload.mediaKey === "string" ? payload.mediaKey.trim() : "";
    const mediaContentType =
      typeof payload.mediaContentType === "string"
        ? payload.mediaContentType.trim()
        : "";
    const mediaUrl =
      typeof payload.mediaUrl === "string" ? payload.mediaUrl.trim() : "";

    const hasMedia = Boolean(mediaKey);

    if (!hasMedia && !text) {
      socket.emit(SOCKET_EVENT.chatError, {
        message: "Message cannot be empty",
      });
      return;
    }

    if (text.length > MESSAGE_TEXT_MAX_LENGTH) {
      socket.emit(SOCKET_EVENT.chatError, {
        message: "Message is too long",
      });
      return;
    }

    if (hasMedia) {
      if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(mediaContentType)) {
        socket.emit(SOCKET_EVENT.chatError, {
          message: "Only JPEG, PNG, WebP, and GIF images are allowed",
        });
        return;
      }

      if (!isMediaKeyForRoom(mediaKey, roomId)) {
        socket.emit(SOCKET_EVENT.chatError, {
          message: "Media does not belong to this room",
        });
        return;
      }
    }

    try {
      const message = await createMessage({
        text,
        senderId: socket.data.user.id,
        roomId,
        type: hasMedia ? "media" : "text",
        mediaKey: hasMedia ? mediaKey : null,
        mediaContentType: hasMedia ? mediaContentType : null,
      });

      if (hasMedia && mediaUrl) {
        message.mediaUrl = mediaUrl;
      }

      // Only clients that joined this room receive the message (and signed URL).
      io.to(roomId).emit(SOCKET_EVENT.chatMessage, { message });
    } catch (error) {
      console.error("[socket.io] Failed to save message", error);
      socket.emit(SOCKET_EVENT.chatError, {
        message: "Could not send message. Please try again.",
      });
    }
  });
}

module.exports = {
  SOCKET_EVENT,
  registerChatHandlers,
};
