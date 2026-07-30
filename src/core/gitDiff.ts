/**
 * FR-2: fetch staged changes via `git diff --cached`.
 *
 * The actual process spawn is injected as a `GitRunner` so the parsing /
 * classification logic can be unit-tested without a real git repo.
 */

export type GitDiffResult =
  | { kind: "diff"; diff: string }
  | { kind: "empty" } // repo exists but nothing is staged
  | { kind: "not-a-repo" }
  | { kind: "git-missing" }
  | { kind: "error"; message: string };

export interface GitRunOutcome {
  stdout: string;
  stderr: string;
  /** null when git could not be spawned at all (e.g. not installed). */
  exitCode: number | null;
  /** true when the binary itself could not be found (ENOENT). */
  spawnFailed?: boolean;
}

export type GitRunner = (args: string[], cwd: string) => Promise<GitRunOutcome>;

/** Classifies the raw outcome of `git diff --cached` into a typed result. */
export function classifyDiffOutcome(outcome: GitRunOutcome): GitDiffResult {
  if (outcome.spawnFailed) {
    return { kind: "git-missing" };
  }

  if (outcome.exitCode === 0) {
    const diff = outcome.stdout.trim();
    return diff.length === 0 ? { kind: "empty" } : { kind: "diff", diff: outcome.stdout };
  }

  const stderr = outcome.stderr.toLowerCase();
  if (stderr.includes("not a git repository")) {
    return { kind: "not-a-repo" };
  }

  return { kind: "error", message: outcome.stderr.trim() || `git exited with code ${outcome.exitCode}` };
}

export async function getStagedDiff(runner: GitRunner, cwd: string): Promise<GitDiffResult> {
  try {
    const outcome = await runner(["diff", "--cached"], cwd);
    return classifyDiffOutcome(outcome);
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

/** A friendly, user-facing message for non-diff results. */
export function messageForResult(result: GitDiffResult): string {
  switch (result.kind) {
    case "empty":
      return "No staged changes found. Stage some changes with `git add` and try again.";
    case "not-a-repo":
      return "This workspace is not a Git repository.";
    case "git-missing":
      return "Git does not appear to be installed or is not on your PATH.";
    case "error":
      return `Could not read staged changes: ${result.message}`;
    case "diff":
      return "";
  }
}
