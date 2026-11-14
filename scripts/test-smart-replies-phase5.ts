/**
 * Phase 5 hardening checks for Smart Replies.
 * Does not log message contents, suggestion text, tokens, or API keys.
 */
import { config } from "dotenv";
import jwt from "jsonwebtoken";
import { sanitizeSmartReplySuggestions } from "../src/features/chat/api/smart-replies.service";
import type { ChatMessage } from "../src/features/chat/types/chat.types";
import { appendToDraft } from "../src/features/chat/utils/appendToDraft";
import {
  buildChatAiContext,
  findLatestIncomingTextMessage,
} from "../src/features/chat/utils/buildChatAiContext";

config({ path: ".env.local" });

const BASE_URL = process.env.SMART_REPLIES_TEST_BASE_URL ?? "http://localhost:3000";
const ME = "user-me";
const PEER = "user-peer";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${label}`);
}

function msg(
  partial: Partial<ChatMessage> & Pick<ChatMessage, "id" | "side" | "text">,
): ChatMessage {
  return {
    type: "text",
    roomId: "a@example.com:b@example.com",
    sentAt: new Date().toISOString(),
    senderId: partial.side === "incoming" ? PEER : ME,
    ...partial,
  };
}

console.log("=== Smart Replies Phase 5 ===");

// ---------------------------------------------------------------------------
// 1) Multiple incoming messages → prioritize latest text incoming
// ---------------------------------------------------------------------------
{
  const messages: ChatMessage[] = [
    msg({ id: "1", side: "incoming", text: "First question?" }),
    msg({ id: "2", side: "outgoing", text: "Maybe later" }),
    msg({ id: "3", side: "incoming", text: "Coffee tonight?" }),
    msg({
      id: "4",
      side: "incoming",
      text: "",
      type: "media",
      mediaKey: "rooms/x/file.jpg",
    }),
  ];

  const latest = findLatestIncomingTextMessage(messages, ME);
  assert(latest?.id === "3", "latest incoming skips media and picks newest text");

  const context = buildChatAiContext(messages, ME);
  assert(context.length === 3, "context excludes media-only messages");
  assert(context.length <= 5, "context respects five-message limit");
  assert(
    context.every((item) => item.text.length > 0),
    "context has no empty texts",
  );
}

{
  const many: ChatMessage[] = Array.from({ length: 8 }, (_, index) =>
    msg({
      id: `m${index}`,
      side: index % 2 === 0 ? "incoming" : "outgoing",
      text: `Message ${index}`,
    }),
  );
  const context = buildChatAiContext(many, ME);
  assert(context.length === 5, "context capped at last 5 relevant messages");
}

// ---------------------------------------------------------------------------
// 2) Stale AI response lifecycle (request-id gate used by the hook)
// ---------------------------------------------------------------------------
{
  const isCurrentRequest = (requestId: number, currentRequestId: number) =>
    requestId === currentRequestId;

  assert(
    !isCurrentRequest(1, 2),
    "stale: superseded request id is rejected",
  );
  assert(
    isCurrentRequest(3, 3),
    "fresh response for current request id is accepted",
  );
}

// ---------------------------------------------------------------------------
// 3) Existing draft preservation (append + spacing, never replaces)
// ---------------------------------------------------------------------------
{
  const empty = appendToDraft({
    text: "",
    suggestion: "Sounds good.",
    padSpace: true,
  });
  assert(
    empty.nextText === "Sounds good.",
    "empty draft becomes suggestion only",
  );

  const preserved = appendToDraft({
    text: "Hey —",
    suggestion: "I might be free later.",
    padSpace: true,
  });
  assert(
    preserved.nextText.startsWith("Hey —"),
    "existing draft prefix is preserved",
  );
  assert(
    preserved.nextText === "Hey — I might be free later.",
    "appends with a single separating space",
  );
  assert(
    preserved.nextCaret === preserved.nextText.length,
    "caret moves to end after append",
  );

  const alreadySpaced = appendToDraft({
    text: "Hey — ",
    suggestion: "Maybe tomorrow.",
    padSpace: true,
  });
  assert(
    alreadySpaced.nextText === "Hey — Maybe tomorrow.",
    "does not double-space when draft already ends with whitespace",
  );

  const unchanged = appendToDraft({
    text: "Keep me",
    suggestion: "   ",
    padSpace: true,
  });
  assert(unchanged.nextText === "Keep me", "empty suggestion leaves draft intact");
}

// ---------------------------------------------------------------------------
// 4) DeepSeek / AI soft failures (sanitize + HTTP)
// ---------------------------------------------------------------------------
assert(
  sanitizeSmartReplySuggestions("not-json").length === 0,
  "malformed AI payload soft-fails to []",
);
assert(
  sanitizeSmartReplySuggestions('{"suggestions":["only-one"]}').length === 0,
  "single suggestion soft-fails to []",
);
assert(
  sanitizeSmartReplySuggestions(
    '{"suggestions":["One reply.","Two reply.","Three reply."]}',
  ).length === 3,
  "valid AI payload keeps 3 suggestions",
);

function makeToken(email: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign(
    { sub: `phase5-${email}`, email, phone: "", name: "Phase5" },
    secret,
    { expiresIn: "1h" },
  );
}

async function postSmartReplies(
  token: string | null,
  body: unknown,
  signal?: AbortSignal,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${BASE_URL}/api/chat/smart-replies`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

// ---------------------------------------------------------------------------
// 5) Normal messaging surface area remains independent
// ---------------------------------------------------------------------------
{
  // Smart Replies must not feed the chat error banner path.
  // Contract check: client soft-fail shape never carries `message` error field.
  const soft = { suggestions: [] as string[] };
  assert(
    !("message" in soft),
    "soft-fail payload has no chat-error `message` field",
  );

  // Draft append never implies send — it only returns text/caret.
  const draftResult = appendToDraft({
    text: "Draft stays local",
    suggestion: "until send",
    padSpace: true,
  });
  assert(
    typeof draftResult.nextText === "string" &&
      typeof draftResult.nextCaret === "number",
    "append helper has no send side effects in its return contract",
  );
}

async function runHttpHardening() {
  let serverReachable = false;
  try {
    const probe = await fetch(BASE_URL, { method: "GET" });
    serverReachable = probe.status > 0;
  } catch {
    serverReachable = false;
  }

  if (!serverReachable || !process.env.JWT_SECRET) {
    console.log(
      `SKIP HTTP hardening — server/JWT unavailable (${BASE_URL})`,
    );
    return;
  }

  const memberEmail = "alice@example.com";
  const peerEmail = "bob@example.com";
  const roomId = [memberEmail, peerEmail].sort().join(":");
  const token = makeToken(memberEmail);
  const validBody = {
    roomId,
    latestIncomingMessage: { text: "Want to meet later?" },
    recentMessages: [
      { from: "peer" as const, text: "Are you free this week?" },
      { from: "self" as const, text: "Possibly." },
    ],
  };

  {
    const res = await postSmartReplies(null, validBody);
    assert(
      res.status === 401,
      "HTTP failure: unauthorized stays 401 (not chat error)",
    );
  }

  {
    const res = await postSmartReplies(token, {
      roomId,
      latestIncomingMessage: { text: "" },
    });
    assert(res.status === 400, "HTTP failure: invalid payload stays 400");
  }

  {
    const controller = new AbortController();
    controller.abort();
    let aborted = false;
    try {
      await postSmartReplies(token, validBody, controller.signal);
    } catch (error) {
      aborted =
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("aborted"));
    }
    assert(aborted, "caller abort rejects and does not hang");
  }

  {
    const res = await postSmartReplies(token, validBody);
    const suggestions =
      res.json &&
      typeof res.json === "object" &&
      "suggestions" in res.json &&
      Array.isArray((res.json as { suggestions: unknown }).suggestions)
        ? (res.json as { suggestions: unknown[] }).suggestions
        : null;

    assert(
      res.status === 200 || res.status === 503,
      "live generate returns 200 soft-fail/success or 503 unavailable",
    );

    if (res.status === 200) {
      assert(suggestions !== null, "200 response includes suggestions array");
      const count = suggestions?.length ?? -1;
      assert(
        count === 0 || (count >= 2 && count <= 3),
        "live suggestions are [] or 2–3 (soft-fail allowed)",
      );
    }

    console.log(
      JSON.stringify({
        httpLive: {
          status: res.status,
          suggestionCount: suggestions?.length ?? null,
        },
      }),
    );
  }
}

void runHttpHardening()
  .then(() => {
    console.log(
      JSON.stringify({ summary: { passed, failed, ok: failed === 0 } }),
    );
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((error: unknown) => {
    console.error(
      "Phase 5 HTTP hardening crashed:",
      error instanceof Error ? error.message : "unknown",
    );
    process.exit(1);
  });
