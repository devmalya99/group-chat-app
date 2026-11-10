const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { config } = require("dotenv");
const { attachChatWebSocket } = require("./server/chat-ws");

config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const upgradeHandler = app.getUpgradeHandler();
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (error) {
        console.error("[server] Request failed", error);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    attachChatWebSocket(server, upgradeHandler);

    server.listen(port, () => {
      console.info(
        `[server] Ready on http://${hostname}:${port} (WebSocket path /ws)`,
      );
    });
  })
  .catch((error) => {
    console.error("[server] Failed to start", error);
    process.exit(1);
  });
