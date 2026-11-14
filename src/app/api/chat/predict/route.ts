import { handleChatAiPost } from "@/features/chat/api/chat-ai-route";
import { predictTypingContinuation } from "@/features/chat/api/predict.service";
import { predictTypingSchema } from "@/features/chat/utils/validation";

const EMPTY = { suggestion: "" };

export async function POST(request: Request) {
  return handleChatAiPost(request, {
    feature: "predict",
    schema: predictTypingSchema,
    empty: EMPTY,
    forbiddenMessage:
      "You can only use predictive typing in rooms you belong to",
    logLabel: "Predictive typing",
    execute: async (parsed, abortSignal) => {
      const outcome = await predictTypingContinuation({
        draft: parsed.draft,
        recentMessages: parsed.recentMessages,
        abortSignal,
      });

      if (!outcome.ok) {
        return outcome;
      }

      return { ok: true, body: { suggestion: outcome.suggestion } };
    },
  });
}
