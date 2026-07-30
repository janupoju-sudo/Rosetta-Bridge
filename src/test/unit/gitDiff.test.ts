import * as assert from "node:assert";
import {
  classifyDiffOutcome,
  getStagedDiff,
  GitRunOutcome,
  messageForResult,
} from "../../core/gitDiff";

function outcome(partial: Partial<GitRunOutcome>): GitRunOutcome {
  return { stdout: "", stderr: "", exitCode: 0, ...partial };
}

suite("gitDiff", () => {
  test("classifies a real diff", () => {
    const result = classifyDiffOutcome(outcome({ stdout: "diff --git a b\n+line" }));
    assert.deepStrictEqual(result, { kind: "diff", diff: "diff --git a b\n+line" });
  });

  test("classifies empty staged changes", () => {
    assert.deepStrictEqual(classifyDiffOutcome(outcome({ stdout: "   \n" })), { kind: "empty" });
  });

  test("detects not-a-repo from stderr", () => {
    const result = classifyDiffOutcome(
      outcome({ exitCode: 128, stderr: "fatal: not a git repository" }),
    );
    assert.deepStrictEqual(result, { kind: "not-a-repo" });
  });

  test("detects a missing git binary", () => {
    const result = classifyDiffOutcome(outcome({ spawnFailed: true, exitCode: null }));
    assert.deepStrictEqual(result, { kind: "git-missing" });
  });

  test("surfaces other git errors", () => {
    const result = classifyDiffOutcome(outcome({ exitCode: 1, stderr: "boom" }));
    assert.deepStrictEqual(result, { kind: "error", message: "boom" });
  });

  test("getStagedDiff runs the injected runner", async () => {
    const result = await getStagedDiff(
      async (args) => {
        assert.deepStrictEqual(args, ["diff", "--cached"]);
        return outcome({ stdout: "patch" });
      },
      "/tmp/repo",
    );
    assert.deepStrictEqual(result, { kind: "diff", diff: "patch" });
  });

  test("messageForResult gives friendly text for empty", () => {
    assert.match(messageForResult({ kind: "empty" }), /No staged changes/);
  });
});
