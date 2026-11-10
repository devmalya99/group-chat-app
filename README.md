# Group Chat App

Next.js + TypeScript group chat with Signup/Login UI, Neon Postgres auth, persisted messages, and classic WebSocket live updates.

## Features (this milestone)

- Welcome, Signup, and Login screens (white / purple / soft green UI)
- `POST /api/auth/signup` — name, email, phone, password (bcrypt hashed)
- `POST /api/auth/login` — email or phone + password → JWT
- `GET /api/messages` — list all stored messages (JWT required)
- `POST /api/messages` — save a message for the authenticated user (JWT required)
- Classic WebSocket live chat on the same port via custom `server.js` (`ws`, not Socket.io)
- Chat page loads history from the database, then receives new messages live
- Neon Lakebase Postgres persistence via Drizzle ORM

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Neon Postgres (`DATABASE_URL`)
- Drizzle ORM + bcryptjs + JWT + Zod
- Classic WebSockets via [`ws`](https://github.com/websockets/ws)

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

4. Run with live WebSockets (required for realtime chat):

```bash
npm run dev:server
```

Open [http://localhost:3000](http://localhost:3000).

WebSocket endpoint (same port): `ws://localhost:3000/ws?token=<jwt>`

> `npm run dev` starts Next alone and does **not** enable WebSockets. Use `npm run dev:server` for live messaging.

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

The chat UI sends over WebSocket for live fan-out. HTTP POST remains available.

## WebSocket protocol

Connect:

```text
ws://localhost:3000/ws?token=<jwt>
```

Client → server:

```json
{ "type": "chat.send", "text": "Hello team" }
```

Server → all clients:

```json
{
  "type": "chat.message",
  "message": {
    "id": "...",
    "text": "Hello team",
    "senderId": "...",
    "createdAt": "2026-10-29T08:00:00.000Z"
  }
}
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev:server` | Custom Node server: Next + WebSocket on one port |
| `npm run start:server` | Production custom server after `npm run build` |
| `npm run dev` | Next only (no WebSocket) |
| `npm run build` | Production build |
| `npm run db:push` | Apply Drizzle schema to Neon |
| `npx neon@latest deploy` | Sync Neon config / env |

## Submission

After pushing to GitHub, share:

- Repo URL: `https://github.com/devmalya99/group-chat-app`
- Commit ID: `git rev-parse HEAD`
