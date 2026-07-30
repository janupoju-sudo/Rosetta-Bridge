import type { CancellationToken } from "vscode";
import { ChatMessage, LLMProvider, ProviderError } from "../providers/LLMProvider";
import type { Mode } from "./modes";

/** Describes the captured source being decoded (the "intercept"). */
export interface DecodeMeta {
  /** Short provenance label, e.g. "main.ts · selection · 42 ln" or "staged diff". */
  source: string;
  /** The channel (mode) this decode runs on. */
  channel: Mode;
}

/**
 * Where the decode loop writes its output. The production sink forwards to the
 * webview; tests use a recording sink. Decoupling the loop from the VS Code
 * webview is what makes the core streaming behavior unit-testable.
 */
export interface StreamSink {
  start(meta: DecodeMeta): void;
  chunk(text: string): void;
  done(): void;
  error(message: string): void;
}

/**
 * Drives a single translation: opens the stream, forwards each fragment to the
 * sink, and finishes with `done()` — or reports a user-facing message via
 * `error()` if the provider fails. Cancellation stops forwarding further chunks.
 * Never throws; failures are delivered through the sink.
 */
export async function runDecode(
  provider: LLMProvider,
  messages: ChatMessage[],
  meta: DecodeMeta,
  sink: StreamSink,
  token: CancellationToken,
): Promise<void> {
  sink.start(meta);
  try {
    for await (const fragment of provider.stream(messages, token)) {
      if (token.isCancellationRequested) {
        break;
      }
      sink.chunk(fragment);
    }
    sink.done();
  } catch (err) {
    const message =
      err instanceof ProviderError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Something went wrong while translating.";
    sink.error(message);
  }
}
