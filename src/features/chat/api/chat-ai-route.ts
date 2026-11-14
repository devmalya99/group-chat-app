import { NextResponse } from "next/server";
import type { z } from "zod";
import { getAuthUserFromRequest } from "@/features/auth/utils/request-auth";
import { logger } from "@/services/logging/logger";
import { isRoomMember } from "../utils/filePolicy";
import { getFirstZodError } from "../utils/validation";
import {
  tryAcquireAiSlot,
  type ChatAiRateLimitFeature,
} from "./ai-rate-limit";

const HARD_FAIL_STATUS = {
  disabled: 503,
  unavailable: 503,
  invalid: 400,
} as const;

export type ChatAiServiceFailureCode =
  | "disabled"
  | "unavailable"
  | "invalid"
  | "failed"
  | "cancelled";

export type ChatAiServiceOutcome<TBody extends Record<string, unknown>> =
  | { ok: true; body: TBody }
  | { ok: false; code: ChatAiServiceFailureCode; message: string };

type RoomScopedInput = { roomId: string };

/**
 * Shared POST orchestration for chat AI endpoints:
 * auth → JSON → zod → room membership → rate slot → execute → soft-fail map.
 */
export async function handleChatAiPost<
  TInput extends RoomScopedInput,
  TBody extends Record<string, unknown>,
>(
  request: Request,
  options: {
    feature: ChatAiRateLimitFeature;
    schema: z.ZodType<TInput>;
    empty: TBody;
    forbiddenMessage: string;
    logLabel: string;
    execute: (
      input: TInput,
      abortSignal: AbortSignal,
    ) => Promise<ChatAiServiceOutcome<TBody>>;
  },
): Promise<Response> {
  let releaseSlot: (() => void) | null = null;

  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = options.schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: getFirstZodError(parsed.error) },
        { status: 400 },
      );
    }

    if (!isRoomMember(parsed.data.roomId, user.email)) {
      return NextResponse.json(
        { message: options.forbiddenMessage },
        { status: 403 },
      );
    }

    const slot = tryAcquireAiSlot(user.id, options.feature);
    if (!slot.ok) {
      return NextResponse.json(options.empty, { status: 429 });
    }
    releaseSlot = slot.release;

    const outcome = await options.execute(parsed.data, request.signal);

    if (!outcome.ok) {
      if (outcome.code in HARD_FAIL_STATUS) {
        const status =
          HARD_FAIL_STATUS[outcome.code as keyof typeof HARD_FAIL_STATUS];
        return NextResponse.json({ message: outcome.message }, { status });
      }

      if (outcome.code !== "cancelled") {
        logger.warn(`${options.logLabel} failed`, { code: outcome.code });
      }

      return NextResponse.json(options.empty, { status: 200 });
    }

    return NextResponse.json(outcome.body, { status: 200 });
  } catch (error) {
    logger.error(`${options.logLabel} route failed`, {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(options.empty, { status: 200 });
  } finally {
    releaseSlot?.();
  }
}
