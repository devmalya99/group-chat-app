const { neon } = require("@neondatabase/serverless");
const jwt = require("jsonwebtoken");

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

function getTokenFromHandshake(handshake) {
  const authToken = handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }

  const queryToken = handshake.query?.token;
  if (typeof queryToken === "string" && queryToken.trim()) {
    return queryToken.trim();
  }

  if (Array.isArray(queryToken) && typeof queryToken[0] === "string") {
    return queryToken[0].trim();
  }

  return null;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(databaseUrl);
}

async function findUserById(userId) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, email, phone
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
  };
}

async function socketAuthMiddleware(socket, next) {
  try {
    const token = getTokenFromHandshake(socket.handshake);

    if (!token) {
      next(new Error("Authorization token is missing"));
      return;
    }

    const decoded = verifyAuthToken(token);

    if (!decoded) {
      next(new Error("Invalid or expired token"));
      return;
    }

    const user = await findUserById(decoded.id);

    if (!user) {
      next(new Error("User not found"));
      return;
    }

    socket.data.user = user;
    next();
  } catch (error) {
    console.error("[socket.io] Auth middleware failed", error);
    next(new Error("Internal Server Error"));
  }
}

module.exports = {
  socketAuthMiddleware,
};
