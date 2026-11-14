import { createDeepSeek } from "@ai-sdk/deepseek";
import type { LanguageModel } from "ai";

const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

let cachedModel: LanguageModel | null | undefined;

function readEnvKey(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) {
    return undefined;
  }

  return raw.trim().replace(/^["']|["']$/g, "");
}

export function hasDeepSeekProvider(): boolean {
  return Boolean(readEnvKey("DEEPSEEK_API_KEY"));
}

export function getDeepSeekModelId(): string {
  return readEnvKey("DEEPSEEK_MODEL") ?? DEFAULT_DEEPSEEK_MODEL;
}

export function getDeepSeekModel(): LanguageModel | null {
  if (cachedModel !== undefined) {
    return cachedModel;
  }

  const apiKey = readEnvKey("DEEPSEEK_API_KEY");
  if (!apiKey) {
    cachedModel = null;
    return null;
  }

  const client = createDeepSeek({ apiKey });
  cachedModel = client(getDeepSeekModelId());
  return cachedModel;
}
