import * as assert from "node:assert";
import { buildMessages } from "../../providers/LLMProvider";

suite("buildMessages", () => {
  test("produces a system message then a user message", () => {
    const messages = buildMessages("SYS", "CODE");
    assert.deepStrictEqual(messages, [
      { role: "system", content: "SYS" },
      { role: "user", content: "CODE" },
    ]);
  });
});
