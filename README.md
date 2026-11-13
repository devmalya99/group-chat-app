# Group Chat App

Next.js + TypeScript group chat with Signup/Login UI, Neon Postgres auth, persisted messages, and Socket.IO live updates.

## Features (this milestone)

- Welcome, Signup, and Login screens (white / purple / soft green UI)
- `POST /api/auth/signup` — name, email, phone, password (bcrypt hashed)
- `POST /api/auth/login` — email or phone + password → JWT
- `GET /api/messages` — list all stored messages (JWT required)
- `POST /api/messages` — save a message for the authenticated user (JWT required)
- `GET /api/users/by-email?email=` — verify a peer email exists before joining a room (JWT required)
- Socket.IO live chat on the same port via custom `server.js` (`server/socket-io/`)
- Personal rooms: enter a peer email → lookup → deterministic room ID → `join_room`
- Chat page loads history from the database, then receives new messages live
- Neon Lakebase Postgres persistence via Drizzle ORM

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Neon Postgres (`DATABASE_URL`)
- Drizzle ORM + bcryptjs + JWT + Zod
- Realtime via [`socket.io`](https://socket.io/) + [`socket.io-client`](https://socket.io/docs/v4/client-api/)

## Socket.IO backend layout

```text
server/socket-io/
├── index.js           # Socket.IO entry (CORS, connection wiring)
├── middleware.js      # Handshake auth middleware
└── handlers/
    └── chat.js        # chat:send / chat:message handlers
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Ensure `.env.local` has:

```bash
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
NEON_BRANCH=...
JWT_SECRET=...
```

Neon vars come from:

```bash
npx neon@latest deploy
```

3. Push the schema:

```bash
npm run db:push
```

4. Run with Socket.IO (required for realtime chat):

```bash
npm run dev:server
```

Open [http://localhost:3000](http://localhost:3000).

Socket.IO endpoint (same port): `http://localhost:3000` path `/socket.io`

> `npm run dev` starts Next alone and does **not** enable Socket.IO. Use `npm run dev:server` for live messaging.

## Auth API

### Signup

`POST /api/auth/signup`

```json
{
  "name": "Alex Rivera",
  "email": "alex@email.com",
  "phone": "+15550102030",
  "password": "password123"
}
```

### Login

`POST /api/auth/login`

```json
{
  "identifier": "alex@email.com",
  "password": "password123"
}
```

Both return:

```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "...", "phone": "..." }
}
```

## Messages API

All message endpoints require:

```http
Authorization: Bearer <jwt>
```

### List messages

`GET /api/messages`

```json
{
  "messages": [
    {
      "id": "...",
      "text": "Hello team",
      "senderId": "...",
      "createdAt": "2026-10-29T08:00:00.000Z"
    }
  ]
}
```

### Send message (HTTP fallback)

`POST /api/messages`

```json
{
  "text": "Hello team"
}
```

The chat UI sends over Socket.IO for live fan-out. HTTP POST remains available.

## User lookup API

Verify a peer email exists before joining a personal room.

`GET /api/users/by-email?email=friend@email.com`

Requires:

```http
Authorization: Bearer <jwt>
```

Success (`200`):

```json
{
  "user": {
    "id": "...",
    "name": "Friend Name",
    "email": "friend@email.com"
  }
}
```

Not found (`404`):

```json
{ "message": "No user found with that email" }
```

## Personal room ID

Clients build a deterministic room ID from both emails (trim + lowercase, sort alphabetically, join with `:`):

```text
alice@email.com + bob@email.com
→ alice@email.com:bob@email.com
```

Order does not matter: A→B and B→A produce the same `roomId`.

## Socket.IO protocol

### Handshake auth

Client passes the JWT during handshake:

```ts
io("http://localhost:3000", {
  auth: {
    token: session.token, // from localStorage auth session
  },
});
```

Server auth middleware reads `socket.handshake.auth.token`, verifies the JWT, loads the user from Postgres, then attaches `socket.data.user`.

### CORS

```js
cors: {
  origin: process.env.NODE_ENV === "production"
    ? false
    : ["http://localhost:3000"],
  credentials: true,
}
```

### Events

Client → server event `join_room`:

```json
{ "roomId": "alice@email.com:bob@email.com" }
```

Server leaves any previous personal room on that socket, joins the new room, then emits `room:joined` back to the same client:

```json
{ "roomId": "alice@email.com:bob@email.com" }
```

Client → server event `chat:send`:

```json
{ "text": "Hello team" }
```

Server → **only sockets in the sender’s active room** event `chat:message`:

```json
{
  "message": {
    "id": "...",
    "text": "Hello team",
    "senderId": "...",
    "createdAt": "2026-10-29T08:00:00.000Z"
  }
}
```

Clients that have not joined a room do not receive live messages. Sending without an active room returns `chat:error`. The chat UI also hides history until a room is joined (messages are not yet stored per-room in the database).

Server → one client event `chat:error`:

```json
{ "message": "Message cannot be empty" }
```

### Manual check (join room)

1. Sign up / log in as User A and User B in two browsers (or normal + private window).
2. Run `npm run dev:server`.
3. On User A’s chat page, enter User B’s email → **Join room**.
4. Confirm the status shows room joined and the header shows User B’s name.
5. Enter a fake email → expect “No user found with that email” and no join.
6. On User B, enter User A’s email → both should land in the same `roomId`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev:server` | Custom Node server: Next + Socket.IO on one port |
| `npm run start:server` | Production custom server after `npm run build` |
| `npm run dev` | Next only (no Socket.IO) |
| `npm run build` | Production build |
| `npm run db:push` | Apply Drizzle schema to Neon |
| `npx neon@latest deploy` | Sync Neon config / env |

## Submission

After pushing to GitHub, share:

- Repo URL: `https://github.com/devmalya99/group-chat-app`
- Commit ID: `git rev-parse HEAD`
