# Group Chat App

Next.js + TypeScript group chat with Signup/Login UI, Neon Postgres auth, persisted messages, and Socket.IO live updates.

## Features (this milestone)

- Welcome, Signup, and Login screens (white / purple / soft green UI)
- `POST /api/auth/signup` — name, email, phone, password (bcrypt hashed)
- `POST /api/auth/login` — email or phone + password → JWT
- `GET /api/messages?roomId=` — room-scoped history (JWT + room membership required)
- `POST /api/messages` — save a text message for a room (JWT required)
- `POST /api/media/upload` — upload a file to Neon Object Storage (JWT + room membership)
- `GET /api/media/access?roomId=&key=` — room-gated signed URL for private files
- `DELETE /api/media/delete?roomId=&messageId=` — uploader-only hard delete (DB + Neon object)
- `GET /api/users/by-email?email=` — verify a peer email exists before joining a room (JWT required)
- Socket.IO live chat on the same port via custom `server.js` (`server/socket-io/`)
- Personal rooms: enter a peer email → lookup → deterministic room ID → `join_room`
- File sharing via composer **+** (images, MP4, PDF, TXT, DOC, DOCX) → Neon `uploads` → Socket.IO
- Neon Lakebase Postgres persistence via Drizzle ORM

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Neon Postgres (`DATABASE_URL`) + Neon Object Storage (`uploads` bucket)
- Drizzle ORM + bcryptjs + JWT + Zod + Files SDK
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

### List messages (room-scoped)

`GET /api/messages?roomId=alice@email.com:bob@email.com`

Caller must be a participant in `roomId`. Media rows include a short-lived signed `mediaUrl`.

### Send message (HTTP fallback)

`POST /api/messages`

```json
{
  "text": "Hello team",
  "roomId": "alice@email.com:bob@email.com"
}
```

The chat UI sends over Socket.IO for live fan-out. HTTP POST remains available.

## File sharing API

Private Neon Object Storage bucket: `uploads`.

| Category | Types | Max size |
|---|---|---|
| Images | JPEG, PNG, WebP, GIF | 5 MB |
| Video | MP4 | 10 MB |
| Documents | PDF, TXT, DOC, DOCX | 5 MB |

One file per send. Only room members can upload/access. Only the uploader can delete.

### Upload file

`POST /api/media/upload` — `multipart/form-data`

Fields: `file`, `roomId`

Requires JWT + room membership. Response:

```json
{
  "key": "rooms/alice%40email.com%3Abob%40email.com/<uuid>.pdf",
  "contentType": "application/pdf",
  "url": "<signed-get-url>",
  "originalFileName": "notes.pdf",
  "fileCategory": "document",
  "fileSize": 204800
}
```

### Access file (re-sign)

`GET /api/media/access?roomId=...&key=...`

Returns `{ "url": "<signed-get-url>" }` only if the caller belongs to that room and the key is under that room’s prefix.

### Delete file (uploader only)

`DELETE /api/media/delete?roomId=...&messageId=...`

Hard-deletes the Neon object and the message row.

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

Client → server event `chat:send` (text):

```json
{ "text": "Hello team" }
```

Client → server event `chat:send` (file, after HTTP upload — metadata only, no signed URL):

```json
{
  "text": "",
  "mediaKey": "rooms/.../uuid.pdf",
  "mediaContentType": "application/pdf",
  "originalFileName": "notes.pdf"
}
```

Clients then call `GET /api/media/access` for a short-lived download/preview URL.

After an uploader deletes a file via HTTP, they emit `chat:file-deleted` `{ "messageId": "..." }` so room peers remove the bubble live.

Server → **only sockets in the sender’s active room** event `chat:message`:

```json
{
  "message": {
    "id": "...",
    "roomId": "alice@email.com:bob@email.com",
    "type": "text",
    "text": "Hello team",
    "senderId": "...",
    "createdAt": "2026-10-29T08:00:00.000Z"
  }
}
```

Clients that have not joined a room do not receive live messages. Sending without an active room returns `chat:error`. After join, the UI loads that room’s history from `GET /api/messages?roomId=`.

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

### Manual check (file sharing)

1. Restart with `npm run dev:server` after Socket.IO handler changes.
2. Join the same room as User A and User B.
3. User A taps **+** and sends an image (≤ 5 MB) → both see an image preview.
4. User A sends a PDF or MP4 (within size limits) → both see a download card; Download works.
5. User B cannot see a **Delete** control on A’s files; User A can delete their own file.
6. After delete, the bubble disappears for A; refresh B’s room history to confirm it’s gone.
7. A third account that is not in the room cannot list or access those files.

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
