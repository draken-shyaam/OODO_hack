import { env } from "../config/env";

/**
 * Optional phrasing layer — takes an already-computed, already-correct
 * deterministic string and asks an LLM to phrase it more naturally.
 *
 * Hard rule: this function NEVER decides facts, numbers, or recommendations.
 * It only rewrites text that some other deterministic engine already
 * produced. If narration is disabled, unconfigured, or fails for ANY
 * reason (network, auth, rate limit, malformed response, package missing),
 * it falls back to the original deterministic text unchanged — every
 * feature that calls this must work correctly with narration off.
 */
export async function narrate(deterministicText: string, context?: string): Promise<string> {
  if (!env.LLM_NARRATION_ENABLED) return deterministicText;
  if (!env.ANTHROPIC_API_KEY) return deterministicText;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content:
            "Rephrase the following operational message in plain, natural English. " +
            "Do not add, remove, or alter any facts, numbers, names, statuses, or references — " +
            "only improve the phrasing and flow. Return ONLY the rephrased text, nothing else." +
            (context ? `\n\nContext: ${context}` : "") +
            `\n\nMessage: ${deterministicText}`,
        },
      ],
    });

    const block = response.content[0];
    const text = block?.type === "text" ? block.text.trim() : "";
    return text || deterministicText;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[llm/narrate] falling back to deterministic text:", error instanceof Error ? error.message : error);
    return deterministicText;
  }
}
