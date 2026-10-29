# Group Chat App

Next.js + TypeScript group chat starter with Signup/Login UI and Neon Postgres auth APIs.

## Features (this milestone)

- Welcome, Signup, and Login screens (white / purple / soft green UI)
- `POST /api/auth/signup` — name, email, phone, password (bcrypt hashed)
- `POST /api/auth/login` — email or phone + password → JWT
- Neon Lakebase Postgres persistence via Drizzle ORM

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Neon Postgres (`DATABASE_URL`)
- Drizzle ORM + bcryptjs + JWT + Zod

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

4. Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js |
| `npm run build` | Production build |
| `npm run db:push` | Apply Drizzle schema to Neon |
| `npx neon@latest deploy` | Sync Neon config / env |

## Submission

After pushing to GitHub, share:

- Repo URL: `https://github.com/devmalya99/group-chat-app`
- Commit ID: `git rev-parse HEAD`
