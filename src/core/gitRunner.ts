import { execFile } from "node:child_process";
import { GitRunOutcome, GitRunner } from "./gitDiff";

/**
 * Production {@link GitRunner} that spawns the real `git` binary.
 * Kept separate from `gitDiff.ts` so the classification logic stays pure
 * and unit-testable without a git repo.
 */
export const spawnGitRunner: GitRunner = (args, cwd) =>
  new Promise<GitRunOutcome>((resolve) => {
    execFile(
      "git",
      args,
      { cwd, maxBuffer: 20 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error && (error as NodeJS.ErrnoException).code === "ENOENT") {
          resolve({ stdout: "", stderr: String(error), exitCode: null, spawnFailed: true });
          return;
        }
        const exitCode = error && typeof error.code === "number" ? error.code : 0;
        resolve({ stdout, stderr, exitCode });
      },
    );
  });
