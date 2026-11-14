import { handleChatAiPost } from "@/features/chat/api/chat-ai-route";
import { generateSmartReplies } from "@/features/chat/api/smart-replies.service";
import { smartRepliesSchema } from "@/features/chat/utils/validation";

const EMPTY = { suggestions: [] as string[] };

export async function POST(request: Request) {
  return handleChatAiPost(request, {
    feature: "smart-replies",
    schema: smartRepliesSchema,
    empty: EMPTY,
    forbiddenMessage: "You can only use smart replies in rooms you belong to",
    logLabel: "Smart replies",
    execute: async (parsed, abortSignal) => {
      const outcome = await generateSmartReplies({
        latestIncomingMessage: parsed.latestIncomingMessage.text,
        recentMessages: parsed.recentMessages,
        abortSignal,
      });

      if (!outcome.ok) {
        return outcome;
      }

      return { ok: true, body: { suggestions: outcome.suggestions } };
    },
  });
}
