const { neon } = require("@neondatabase/serverless");

const MESSAGE_TEXT_MAX_LENGTH = 2000;

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

async function createMessage({ text, senderId }) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO messages (text, sender_id)
    VALUES (${text}, ${senderId})
    RETURNING id, text, sender_id, created_at
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("Could not save message");
  }

  return {
    id: row.id,
    text: row.text,
    senderId: row.sender_id,
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

    const text = typeof payload.text === "string" ? payload.text.trim() : "";

    if (!text) {
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

    try {
      const message = await createMessage({
        text,
        senderId: socket.data.user.id,
      });
      // Only clients that joined this room receive the message.
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
