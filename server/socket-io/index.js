const { Server } = require("socket.io");
const { socketAuthMiddleware } = require("./middleware");
const { registerChatHandlers } = require("./handlers/chat");

const SOCKET_PATH = "/socket.io";

function getCorsOrigin() {
  if (process.env.NODE_ENV === "production") {
    return process.env.SOCKET_CORS_ORIGIN || false;
  }

  return ["http://localhost:3000"];
}

function attachChatSocket(server, nextUpgradeHandler) {
  const io = new Server(server, {
    path: SOCKET_PATH,
    cors: {
      origin: getCorsOrigin(),
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  server.on("upgrade", (request, socket, head) => {
    const url = request.url || "";
    if (url.startsWith(SOCKET_PATH)) {
      return;
    }

    if (typeof nextUpgradeHandler === "function") {
      nextUpgradeHandler(request, socket, head);
      return;
    }

    socket.destroy();
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    registerChatHandlers(io, socket);
  });

  return io;
}

module.exports = {
  SOCKET_PATH,
  attachChatSocket,
};
