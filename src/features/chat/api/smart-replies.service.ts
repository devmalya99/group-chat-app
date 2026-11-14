import {
  CHAT_AI_CONTEXT_TEXT_MAX_LENGTH,
  SMART_REPLIES_MAX_OUTPUT_TOKENS,
  SMART_REPLIES_MAX_SUGGESTION_CHARS,
  SMART_REPLIES_MAX_SUGGESTIONS,
  SMART_REPLIES_MIN_SUGGESTIONS,
  SMART_REPLIES_TIMEOUT_MS,
  isSmartRepliesEnabled,
} from "../constants/chat.constants";
import type { ChatAiContextMessage } from "../types/chat.types";
import { clampChatAiContext } from "../utils/buildChatAiContext";
import { runDeepSeek } from "./run-deepseek";
import {
  SMART_REPLIES_SYSTEM_PROMPT,
  buildSmartRepliesUserPrompt,
} from "./smart-replies.prompts";

export type SmartRepliesOutcome =
  | { ok: true; suggestions: string[] }
  | {
      ok: false;
      code: "disabled" | "unavailable" | "invalid" | "failed" | "cancelled";
      message: string;
    };

export interface SmartRepliesParams {
  latestIncomingMessage: string;
  recentMessages?: ChatAiContextMessage[];
  abortSignal?: AbortSignal;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractSuggestionsJson(raw: string): string[] | null {
  const trimmed = stripCodeFences(raw);
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as { suggestions?: unknown };
    if (Array.isArray(parsed.suggestions)) {
      return parsed.suggestions.filter(
        (item): item is string => typeof item === "string",
      );
    }
  } catch {
    // Fall through to partial JSON recovery.
  }

  const match = trimmed.match(
    /\{[\s\S]*"suggestions"\s*:\s*\[([\s\S]*?)\][\s\S]*\}/,
  );
  if (!match?.[1]) {
    return null;
  }

  try {
    const parsed = JSON.parse(`[${match[1]}]`) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return null;
  }
}

function looksLikeNumberedOrLabeled(text: string): boolean {
  return /^(?:\d+[\).\:\-]\s+|[-*•]\s+|(?:suggestion|option|reply)\s*\d*\s*[:\-]\s*)/i.test(
    text,
  );
}

function sanitizeOneSuggestion(raw: string): string {
  let suggestion = normalizeText(raw)
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();

  if (!suggestion || looksLikeNumberedOrLabeled(suggestion)) {
    return "";
  }

  if (suggestion.split(/(?<=[.!?])\s+/).length > 2) {
    return "";
  }

  if (suggestion.length > SMART_REPLIES_MAX_SUGGESTION_CHARS) {
    suggestion = suggestion
      .slice(0, SMART_REPLIES_MAX_SUGGESTION_CHARS)
      .trimEnd();
  }

  return suggestion;
}

/**
 * Parses and sanitizes model output into 2–3 unique suggestions.
 * Returns [] when the response is malformed or quality gates fail.
 */
export function sanitizeSmartReplySuggestions(raw: string): string[] {
  const extracted = extractSuggestionsJson(raw);
  if (!extracted) {
    return [];
  }

  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const item of extracted) {
    const suggestion = sanitizeOneSuggestion(item);
    if (!suggestion) {
      continue;
    }

    const key = suggestion.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    suggestions.push(suggestion);

    if (suggestions.length >= SMART_REPLIES_MAX_SUGGESTIONS) {
      break;
    }
  }

  if (
    suggestions.length < SMART_REPLIES_MIN_SUGGESTIONS ||
    suggestions.length > SMART_REPLIES_MAX_SUGGESTIONS
  ) {
    return [];
  }

  return suggestions;
}

export async function generateSmartReplies(
  params: SmartRepliesParams,
): Promise<SmartRepliesOutcome> {
  if (!isSmartRepliesEnabled()) {
    return {
      ok: false,
      code: "disabled",
      message: "Smart replies are disabled",
    };
  }

  const latestIncomingMessage = normalizeText(params.latestIncomingMessage).slice(
    0,
    CHAT_AI_CONTEXT_TEXT_MAX_LENGTH,
  );

  if (!latestIncomingMessage) {
    return {
      ok: false,
      code: "invalid",
      message: "Latest incoming message cannot be empty",
    };
  }

  const outcome = await runDeepSeek({
    instructions: SMART_REPLIES_SYSTEM_PROMPT,
    prompt: buildSmartRepliesUserPrompt({
      latestIncomingMessage,
      recentMessages: clampChatAiContext(params.recentMessages),
    }),
    temperature: 0.4,
    maxOutputTokens: SMART_REPLIES_MAX_OUTPUT_TOKENS,
    timeoutMs: SMART_REPLIES_TIMEOUT_MS,
    abortSignal: params.abortSignal,
    unavailableMessage: "Smart replies are unavailable",
    failedMessage: "Smart replies failed",
    cancelledMessage: "Smart replies request was cancelled",
  });

  if (!outcome.ok) {
    return outcome;
  }

  return {
    ok: true,
    suggestions: sanitizeSmartReplySuggestions(outcome.text),
  };
}
