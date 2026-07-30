import * as assert from "node:assert";
import type { CancellationToken } from "vscode";
import { DecodeMeta, runDecode, StreamSink } from "../../core/streaming";
import { ChatMessage, LLMProvider, ProviderError } from "../../providers/LLMProvider";

const meta: DecodeMeta = { source: "auth.ts · selection · 3 ln", channel: "executive" };
const messages: ChatMessage[] = [
  { role: "system", content: "sys" },
  { role: "user", content: "code" },
];

/** A sink that records the sequence of calls it receives. */
function recordingSink(): { events: string[]; sink: StreamSink } {
  const events: string[] = [];
  return {
    events,
    sink: {
      start: () => events.push("start"),
      chunk: (t) => events.push(`chunk:${t}`),
      done: () => events.push("done"),
      error: (m) => events.push(`error:${m}`),
    },
  };
}

/** A provider whose stream is driven by the supplied async generator. */
function fakeProvider(gen: () => AsyncIterable<string>): LLMProvider {
  return {
    id: "fake",
    displayName: "Fake",
    isAvailable: async () => null,
    stream: () => gen(),
  };
}

const liveToken = { isCancellationRequested: false } as unknown as CancellationToken;

suite("runDecode", () => {
  test("streams chunks in order, then done", async () => {
    const { events, sink } = recordingSink();
    const provider = fakeProvider(async function* () {
      yield "Improves ";
      yield "checkout ";
      yield "reliability.";
    });

    await runDecode(provider, messages, meta, sink, liveToken);

    assert.deepStrictEqual(events, [
      "start",
      "chunk:Improves ",
      "chunk:checkout ",
      "chunk:reliability.",
      "done",
    ]);
  });

  test("reports a ProviderError via sink.error and never calls done", async () => {
    const { events, sink } = recordingSink();
    const provider = fakeProvider(async function* () {
      yield "partial";
      throw new ProviderError("No Copilot model is available.");
    });

    await runDecode(provider, messages, meta, sink, liveToken);

    assert.deepStrictEqual(events, [
      "start",
      "chunk:partial",
      "error:No Copilot model is available.",
    ]);
  });

  test("falls back to a generic message for a non-ProviderError throw", async () => {
    const { events, sink } = recordingSink();
    const provider = fakeProvider(() => ({
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<string>> {
            return Promise.reject({ notAnError: true });
          },
        };
      },
    }));

    await runDecode(provider, messages, meta, sink, liveToken);

    assert.deepStrictEqual(events, ["start", "error:Something went wrong while translating."]);
  });

  test("stops forwarding chunks once cancelled", async () => {
    const { events, sink } = recordingSink();
    const token = { isCancellationRequested: false };
    const provider = fakeProvider(async function* () {
      yield "first";
      token.isCancellationRequested = true; // cancel mid-stream
      yield "second";
      yield "third";
    });

    await runDecode(provider, messages, meta, sink, token as unknown as CancellationToken);

    // "first" is forwarded; the cancellation check breaks before "second".
    assert.deepStrictEqual(events, ["start", "chunk:first", "done"]);
  });
});
