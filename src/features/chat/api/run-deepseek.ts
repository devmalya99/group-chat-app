import { generateText, type LanguageModel } from "ai";
import { getDeepSeekModel } from "./deepseek.provider";

export type DeepSeekRunCode =
  | "unavailable"
  | "failed"
  | "cancelled";

export type DeepSeekRunOutcome =
  | { ok: true; text: string }
  | { ok: false; code: DeepSeekRunCode; message: string };

export interface RunDeepSeekParams {
  instructions: string;
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  abortSignal?: AbortSignal;
  unavailableMessage?: string;
  failedMessage?: string;
  cancelledMessage?: string;
}

/**
 * Shared DeepSeek generateText call for chat AI features.
 * Feature services own prompt building and response sanitization only.
 */
export async function runDeepSeek(
  params: RunDeepSeekParams,
): Promise<DeepSeekRunOutcome> {
  const model: LanguageModel | null = getDeepSeekModel();
  if (!model) {
    return {
      ok: false,
      code: "unavailable",
      message: params.unavailableMessage ?? "AI provider is unavailable",
    };
  }

  const timeoutSignal = AbortSignal.timeout(params.timeoutMs);
  const abortSignal = params.abortSignal
    ? AbortSignal.any([params.abortSignal, timeoutSignal])
    : timeoutSignal;

  try {
    const result = await generateText({
      model,
      instructions: params.instructions,
      prompt: params.prompt,
      temperature: params.temperature,
      maxOutputTokens: params.maxOutputTokens,
      abortSignal,
      providerOptions: {
        deepseek: {
          thinking: { type: "disabled" },
        },
      },
    });

    return { ok: true, text: result.text };
  } catch {
    if (params.abortSignal?.aborted) {
      return {
        ok: false,
        code: "cancelled",
        message: params.cancelledMessage ?? "AI request was cancelled",
      };
    }

    return {
      ok: false,
      code: "failed",
      message: params.failedMessage ?? "AI request failed",
    };
  }
}
