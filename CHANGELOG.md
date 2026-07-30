# Change Log

All notable changes to the **Rosetta Bridge** extension are documented here.

## [1.0.0]

Initial release.

- **Two translation channels** backed by the native `vscode.lm` API (GitHub Copilot, incl. Copilot Free):
  - **Executive** — business impact, ROI, and risk briefing for stakeholders (primary/default channel).
  - **Plain** — jargon-free, plain-English walkthrough for non-technical creators.
- **Translate Selection** — explain highlighted code, or the whole file when nothing is selected.
- **Summarize Git Staged Changes** — turn `git diff --cached` into a PR-ready executive summary.
- **Signal Station** sidebar UI — theme-aware, with streaming Markdown output, a channel toggle, and one-click **Copy Transmission**.
- Extensible `LLMProvider` interface (OpenAI, Anthropic, and Ollama are scaffolded for a future release).
