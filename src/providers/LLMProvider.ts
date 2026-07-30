import type { CancellationToken } from "vscode";

/**
 * A single chat message passed to a provider. Rosetta Bridge folds its system
 * instructions into the message list; providers that lack a distinct system
 * role (e.g. `vscode.lm`) may collapse roles as needed.
 */
export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * Minimal contract every LLM backend implements. Keeping it to streaming +
 * availability lets new providers (OpenAI, Anthropic, Ollama) drop in without
 * changing any call site (PRD FR-6 extensibility).
 */
export interface LLMProvider {
  /** Stable identifier matching the `rosettaBridge.provider` config value. */
  readonly id: string;

  /** Human-readable name for status / error messaging. */
  readonly displayName: string;

  /**
   * Pre-flight check. Returns a reason string when unavailable, or null when
   * ready. Lets the orchestrator show actionable guidance before streaming.
   */
  isAvailable(): Promise<string | null>;

  /**
   * Streams the model's response as incremental text fragments.
   * Implementations should throw {@link ProviderError} on failure.
   */
  stream(messages: ChatMessage[], token: CancellationToken): AsyncIterable<string>;
}

/** Typed error carrying a user-facing message the orchestrator can surface. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** Builds the message list from a system prompt and the captured code. */
export function buildMessages(systemPrompt: string, code: string): ChatMessage[] {
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: code },
  ];
}
