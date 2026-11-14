import {
  CHAT_AI_RATE_LIMIT_MAX_CONCURRENT,
  CHAT_AI_RATE_LIMIT_PER_MINUTE,
  CHAT_AI_RATE_LIMIT_WINDOW_MS,
} from "../constants/chat.constants";

export type ChatAiRateLimitFeature = "predict" | "smart-replies";

type AiRateBucket = {
  windowStartedAt: number;
  requestCount: number;
  inFlight: number;
};

const buckets = new Map<string, AiRateBucket>();

function bucketKey(feature: ChatAiRateLimitFeature, userId: string): string {
  return `${feature}:${userId}`;
}

function pruneIdleExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (
      bucket.inFlight === 0 &&
      now - bucket.windowStartedAt >= CHAT_AI_RATE_LIMIT_WINDOW_MS
    ) {
      buckets.delete(key);
    }
  }
}

function getBucket(key: string, now: number): AiRateBucket {
  pruneIdleExpiredBuckets(now);

  const existing = buckets.get(key);
  if (
    existing &&
    now - existing.windowStartedAt < CHAT_AI_RATE_LIMIT_WINDOW_MS
  ) {
    return existing;
  }

  const next: AiRateBucket = {
    windowStartedAt: now,
    requestCount: 0,
    inFlight: existing?.inFlight ?? 0,
  };
  buckets.set(key, next);
  return next;
}

export type AiRateLimitResult =
  | { ok: true; release: () => void }
  | { ok: false; reason: "rate_limited" | "too_many_concurrent" };

/**
 * Best-effort in-memory per-user AI gate (resets on process restart).
 * Not a multi-instance global limit — documents honesty for serverless.
 * Call `release()` in a finally block after the DeepSeek request finishes.
 */
export function tryAcquireAiSlot(
  userId: string,
  feature: ChatAiRateLimitFeature,
): AiRateLimitResult {
  const now = Date.now();
  const key = bucketKey(feature, userId);
  const bucket = getBucket(key, now);

  if (bucket.inFlight >= CHAT_AI_RATE_LIMIT_MAX_CONCURRENT) {
    return { ok: false, reason: "too_many_concurrent" };
  }

  if (bucket.requestCount >= CHAT_AI_RATE_LIMIT_PER_MINUTE) {
    return { ok: false, reason: "rate_limited" };
  }

  bucket.requestCount += 1;
  bucket.inFlight += 1;

  let released = false;
  return {
    ok: true,
    release: () => {
      if (released) {
        return;
      }
      released = true;

      const current = buckets.get(key);
      if (!current) {
        return;
      }

      current.inFlight = Math.max(0, current.inFlight - 1);

      // Idle + expired windows are reclaimable. requestCount alone never
      // returns to 0 inside a live window, so do not require that.
      if (
        current.inFlight === 0 &&
        Date.now() - current.windowStartedAt >= CHAT_AI_RATE_LIMIT_WINDOW_MS
      ) {
        buckets.delete(key);
      }
    },
  };
}
