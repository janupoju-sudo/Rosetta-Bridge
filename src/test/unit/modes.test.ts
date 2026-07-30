import * as assert from "node:assert";
import { coerceMode, systemPromptForMode } from "../../core/modes";
import { EXECUTIVE_SYSTEM_PROMPT, VIBE_CODER_SYSTEM_PROMPT } from "../../core/prompts";

suite("modes", () => {
  test("maps vibeCoder to the vibe coder prompt", () => {
    assert.strictEqual(systemPromptForMode("vibeCoder"), VIBE_CODER_SYSTEM_PROMPT);
  });

  test("maps executive to the executive prompt", () => {
    assert.strictEqual(systemPromptForMode("executive"), EXECUTIVE_SYSTEM_PROMPT);
  });

  test("coerceMode accepts known modes", () => {
    assert.strictEqual(coerceMode("executive"), "executive");
    assert.strictEqual(coerceMode("vibeCoder"), "vibeCoder");
  });

  test("coerceMode falls back to vibeCoder for junk input", () => {
    assert.strictEqual(coerceMode("nonsense"), "vibeCoder");
    assert.strictEqual(coerceMode(undefined), "vibeCoder");
    assert.strictEqual(coerceMode(42), "vibeCoder");
  });
});
