# Product

<!-- impeccable:product-schema 1 -->

<!-- Product truth below is derived from PRD.md (v1.0.0, author Jayesh Anupoju) and the built V1.0 implementation. Facts not stated in the PRD are marked [inferred]. -->

## Platform

web

<!-- The surface is a VS Code Webview (HTML/CSS/JS in an iframe), not a native app. Design must be theme-aware against VS Code CSS variables. -->

## Users

Two primary personas, served by one panel with a mode toggle:

- **Alex — the "Vibe Coder" / non-technical founder.** Builds MVPs with AI code generators (Cursor, Claude, Copilot) without formal CS training. Needs jargon-free, plain-English explanations of what generated code does, how data flows, and where cost/safety risks hide. Reads output to understand and to explain systems to investors, lawyers, partners.
- **Marcus — the senior engineer / tech lead.** Owns infrastructure, refactors, security patches. Needs technical work translated into executive language: PR summaries, ROI justifications, risk-mitigation bullets ready for Jira, Slack, or executive briefings.

Both work *inside VS Code*, mid-task, alongside their code. The panel is a companion, not a destination.

## Product Purpose

Rosetta Bridge is a real-time translation layer between raw source code and strategic business value. It turns a code selection or a staged Git diff into either a plain-English workflow breakdown (Vibe Coder mode) or an executive ROI/risk briefing (Executive mode). Success = the user copies the output into a conversation (investor update, Slack, Jira, PR) or finally understands what their code does, without a human translator.

## Positioning

Not a code explainer and not a doc generator. Rosetta Bridge is a *bidirectional translator between two audiences who cannot currently talk to each other* — it reframes the same code either downward into plain language or upward into business impact, depending on who needs to hear it. Runs on the user's existing GitHub Copilot seat (including Copilot Free) with zero configuration and zero hosting cost.

## Operating Context

- Lives in the VS Code Activity Bar as a sidebar webview panel (`Rosetta Bridge: Translator`).
- Triggered by: selecting code + command/right-click ("Translate Selection"), or "Summarize Git Staged Changes" (runs `git diff --cached`, always Executive framing).
- Output streams token-by-token as Markdown and is re-rendered per chunk.
- One-click "Copy to Clipboard" is the primary terminal action — output is meant to leave the editor and land in Slack/Jira/PR/investor docs.
- Narrow column: a sidebar is typically ~300–400px wide. Vertical, scannable, dense but breathable.

## Capabilities and Constraints

- Two modes: `vibeCoder` and `executive`, each with a fixed structured Markdown output shape (3 sections each — see PRD §4).
- Provider: `vscode.lm` only in this release, behind an extensible `LLMProvider` interface (OpenAI/Anthropic/Ollama are enum-listed but not implemented; selecting one falls back to `vscode-lm` with a notice).
- Must render inside a webview under a strict CSP with a script nonce; styles may be inline. No external network for fonts/assets unless CSP is explicitly widened.
- Must be theme-aware: honor VS Code light/dark/high-contrast themes via `--vscode-*` CSS variables.
- States to design: idle/first-run (no output yet), streaming (busy), completed (copyable), error (no model / no selection / no staged changes / not a repo).
- Compatible with VS Code `^1.90.0`.

## Brand Commitments

- **Name:** Rosetta Bridge. Evokes the Rosetta Stone — translation between languages/audiences — and a bridge between technical and business worlds.
- **Voice:** clear, confident, jargon-free on the Vibe side; crisp and executive on the Exec side. The product itself is a translator, so its own UI copy should never be jargony.
- Existing icon: a minimal two-strand "bridge/translation" SVG mark (`media/rosetta.svg`), monochrome, uses `currentColor`.

## Evidence on Hand

- `PRD.md` — full product requirement document (personas, prompts, architecture, FRs, roadmap).
- Built V1.0 implementation: provider engine, orchestrator, git-diff pipeline, baseline webview. No real customers, testimonials, benchmarks, or install numbers exist yet — the KPI targets in the PRD are goals, not achievements, and must not be presented as facts.

## Product Principles

1. **The panel is a companion, not a stage.** It sits beside code the user is actively working in; it must not fight the editor for attention while still owning a distinct identity.
2. **Two audiences, one artifact.** The mode toggle is the product's core idea made physical — switching audience is a first-class, always-visible act.
3. **Output is meant to leave.** Copy-to-clipboard and clean Markdown are the point; design the output for the destination (Slack/Jira/PR/investor deck), not just for the panel.
4. **Zero-friction default.** Works on install with no keys, no config. The UI should never make the user feel they must configure something to begin.
5. **Honesty about capability.** Only `vscode.lm` works today; unimplemented providers and aspirational metrics are never dressed up as real.

## Accessibility & Inclusion

- Must remain legible and functional in VS Code high-contrast themes and both light/dark.
- Streaming output region is a live region; controls are keyboard-reachable with visible focus.
- Non-technical persona (Alex) means: no unexplained jargon in UI chrome, generous affordance clarity.
