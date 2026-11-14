import {
  PREDICTIVE_TYPING_MAX_OUTPUT_TOKENS,
  PREDICTIVE_TYPING_MAX_SUGGESTION_CHARS,
  PREDICTIVE_TYPING_MIN_DRAFT_LENGTH,
  PREDICTIVE_TYPING_TIMEOUT_MS,
  isPredictiveTypingEnabled,
} from "../constants/chat.constants";
import type { ChatAiContextMessage } from "../types/chat.types";
import { clampChatAiContext } from "../utils/buildChatAiContext";
import {
  PREDICTIVE_TYPING_SYSTEM_PROMPT,
  buildPredictiveTypingUserPrompt,
} from "./predictive-typing.prompts";
import { runDeepSeek } from "./run-deepseek";

export type PredictTypingOutcome =
  | { ok: true; suggestion: string }
  | {
      ok: false;
      code: "disabled" | "unavailable" | "invalid" | "failed" | "cancelled";
      message: string;
    };

export interface PredictTypingParams {
  draft: string;
  recentMessages?: ChatAiContextMessage[];
  abortSignal?: AbortSignal;
}

function extractSuggestionJson(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as { suggestion?: unknown };
    if (typeof parsed.suggestion === "string") {
      return parsed.suggestion;
    }
  } catch {
    // Fall through to partial JSON recovery.
  }

  const match = trimmed.match(
    /\{[\s\S]*"suggestion"\s*:\s*"((?:\\.|[^"\\])*)"[\s\S]*\}/,
  );
  if (!match?.[1]) {
    return null;
  }

  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1];
  }
}

export function sanitizeSuggestion(raw: string, draft: string): string {
  let suggestion = extractSuggestionJson(raw) ?? raw.trim();

  suggestion = suggestion
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!suggestion) {
    return "";
  }

  const draftTrimmed = draft.trimEnd();
  if (suggestion.toLowerCase().startsWith(draftTrimmed.toLowerCase())) {
    suggestion = suggestion.slice(draftTrimmed.length);
  }

  suggestion = suggestion.replace(/^\s+/, "");

  if (suggestion.length > PREDICTIVE_TYPING_MAX_SUGGESTION_CHARS) {
    suggestion = suggestion
      .slice(0, PREDICTIVE_TYPING_MAX_SUGGESTION_CHARS)
      .trimEnd();
  }

  return suggestion;
}

export async function predictTypingContinuation(
  params: PredictTypingParams,
): Promise<PredictTypingOutcome> {
  if (!isPredictiveTypingEnabled()) {
    return {
      ok: false,
      code: "disabled",
      message: "Predictive typing is disabled",
    };
  }

  const draft = params.draft;
  if (draft.trim().length < PREDICTIVE_TYPING_MIN_DRAFT_LENGTH) {
    return {
      ok: false,
      code: "invalid",
      message: "Draft is too short",
    };
  }

  const outcome = await runDeepSeek({
    instructions: PREDICTIVE_TYPING_SYSTEM_PROMPT,
    prompt: buildPredictiveTypingUserPrompt({
      draft,
      recentMessages: clampChatAiContext(params.recentMessages),
    }),
    temperature: 0.2,
    maxOutputTokens: PREDICTIVE_TYPING_MAX_OUTPUT_TOKENS,
    timeoutMs: PREDICTIVE_TYPING_TIMEOUT_MS,
    abortSignal: params.abortSignal,
    unavailableMessage: "Predictive typing is unavailable",
    failedMessage: "Predictive typing failed",
    cancelledMessage: "Predictive typing request was cancelled",
  });

  if (!outcome.ok) {
    return outcome;
  }

  return {
    ok: true,
    suggestion: sanitizeSuggestion(outcome.text, draft),
  };
}
