const { neon } = require("@neondatabase/serverless");
const jwt = require("jsonwebtoken");
const { WebSocketServer } = require("ws");

const MESSAGE_TEXT_MAX_LENGTH = 2000;
const WS_PATH = "/ws";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

function verifyAuthToken(token) {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (!payload.sub || typeof payload.sub !== "string") {
      return null;
    }
    return {
      id: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      phone: String(payload.phone ?? ""),
    };
  } catch {
    return null;
  }
}

function getTokenFromRequest(request) {
  try {
    const host = request.headers.host || "localhost";
    const url = new URL(request.url || "/", `http://${host}`);
    const token = url.searchParams.get("token");
    return token && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

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

function sendJson(socket, payload) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function broadcast(wss, payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

function attachChatWebSocket(server, nextUpgradeHandler) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    let pathname = "/";
    try {
      const host = request.headers.host || "localhost";
      pathname = new URL(request.url || "/", `http://${host}`).pathname;
    } catch {
      socket.destroy();
      return;
    }

    if (pathname !== WS_PATH) {
      if (typeof nextUpgradeHandler === "function") {
        nextUpgradeHandler(request, socket, head);
        return;
      }
      socket.destroy();
      return;
    }

    const token = getTokenFromRequest(request);
    const user = token ? verifyAuthToken(token) : null;

    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.user = user;
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    ws.on("message", async (raw) => {
      let payload;
      try {
        payload = JSON.parse(String(raw));
      } catch {
        sendJson(ws, { type: "error", message: "Invalid JSON payload" });
        return;
      }

      if (!payload || payload.type !== "chat.send") {
        sendJson(ws, { type: "error", message: "Unknown event type" });
        return;
      }

      const text =
        typeof payload.text === "string" ? payload.text.trim() : "";

      if (!text) {
        sendJson(ws, { type: "error", message: "Message cannot be empty" });
        return;
      }

      if (text.length > MESSAGE_TEXT_MAX_LENGTH) {
        sendJson(ws, { type: "error", message: "Message is too long" });
        return;
      }

      try {
        const message = await createMessage({
          text,
          senderId: ws.user.id,
        });
        broadcast(wss, { type: "chat.message", message });
      } catch (error) {
        console.error("[WS] Failed to save message", error);
        sendJson(ws, {
          type: "error",
          message: "Could not send message. Please try again.",
        });
      }
    });
  });

  return wss;
}

module.exports = {
  WS_PATH,
  attachChatWebSocket,
};
