import { EXECUTIVE_SYSTEM_PROMPT, VIBE_CODER_SYSTEM_PROMPT } from "./prompts";

/** The two translation modes offered by Rosetta Bridge. */
export type Mode = "vibeCoder" | "executive";

export const MODES: readonly Mode[] = ["vibeCoder", "executive"] as const;

/** Human-readable label for each mode (used in the webview toggle). */
export const MODE_LABELS: Record<Mode, string> = {
  vibeCoder: "Vibe Coder",
  executive: "Executive",
};

/** Returns the system prompt that drives a given mode. */
export function systemPromptForMode(mode: Mode): string {
  switch (mode) {
    case "vibeCoder":
      return VIBE_CODER_SYSTEM_PROMPT;
    case "executive":
      return EXECUTIVE_SYSTEM_PROMPT;
    default: {
      // Exhaustiveness guard — a new Mode must be handled here.
      const _never: never = mode;
      throw new Error(`Unknown mode: ${String(_never)}`);
    }
  }
}

/** Narrows an arbitrary string to a Mode, falling back to vibeCoder. */
export function coerceMode(value: unknown): Mode {
  return value === "executive" ? "executive" : "vibeCoder";
}
