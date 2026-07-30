# Rosetta Bridge

**A real-time translation layer between your source code and its business value — right inside VS Code.**

Rosetta Bridge reads the *same* code two ways and lets you choose the audience with a toggle:

- **Plain (Vibe Coder) channel** — a jargon-free, plain-English walkthrough for non-technical founders: what the code does, how data flows, and where the cost/safety risks hide.
- **Executive channel** — a business-impact briefing for tech leads: executive summary, ROI, risk/security, and ready-to-paste bullets for Slack, Jira, or a PR.

It runs on your existing **GitHub Copilot** seat (including Copilot Free) with **zero configuration** and zero hosting cost.

---

## The Signal Station

The sidebar is a **decoding station**, not a chat box. You *hoist a channel* (Plain or Executive), drop in an intercepted selection, and watch it decode as it streams — then copy the transmission out.

| State | What you see |
| :--- | :--- |
| **Idle** | A channel legend explaining the two modes. |
| **Decoding** | The intercepted source, a signal tether, and text decoding live behind a blinking station cursor. |
| **Decoded** | Structured Markdown, ready to **Copy Transmission**. |
| **Signal lost** | A clear station notice (no model, no selection, no staged changes, not a repo). |

The whole accent system re-colors when you switch channels (teal for Plain, amber for Executive). The UI is fully theme-aware across VS Code light, dark, and high-contrast themes.

---

## Usage

1. **Translate a selection** — select code (or place your cursor in any file), then run **`Rosetta Bridge: Translate Selection`** from the Command Palette or the editor right-click menu. With no selection, the whole file is captured.
2. **Summarize staged changes** — stage some changes (`git add …`), then run **`Rosetta Bridge: Summarize Git Staged Changes`**. This reads `git diff --cached` and always frames it for stakeholders (Executive channel).
3. **Switch channels** — click **CH·1 PLAIN** or **CH·2 EXEC** in the sidebar.
4. **Copy** — hit **Copy Transmission** and paste into Slack, Jira, a PR, or an investor update.

Output streams into the **Rosetta Bridge** view in the Activity Bar.

---

## Commands

| Command | ID |
| :--- | :--- |
| Rosetta Bridge: Translate Selection | `rosettaBridge.translateSelection` |
| Rosetta Bridge: Summarize Git Staged Changes | `rosettaBridge.summarizeStagedChanges` |

## Settings

| Setting | Default | Notes |
| :--- | :--- | :--- |
| `rosettaBridge.provider` | `vscode-lm` | LLM provider. Only `vscode-lm` is implemented in this release; `openai`, `anthropic`, and `ollama` are listed for forward-compatibility and fall back to `vscode-lm`. |
| `rosettaBridge.defaultMode` | `vibeCoder` | The channel selected when the panel opens (`vibeCoder` or `executive`). |

---

## Requirements

- VS Code `^1.90.0`
- An active **GitHub Copilot** session (the free tier works). Rosetta Bridge uses the native `vscode.lm` API, so no API keys are required.

---

## Architecture

A thin activation layer wires the commands and sidebar view to a small, testable core:

```
Command / Webview action
        │
        ▼
  Orchestrator (extension.ts)          capture selection or git diff → pick channel → build messages
        │
        ▼
  ProviderRegistry ─▶ LLMProvider ─▶ VSCodeLMProvider (vscode.lm)   [extensible: OpenAI/Anthropic/Ollama drop in here]
        │  async-iterable text chunks
        ▼
  SidebarViewProvider ──postMessage──▶ Signal Station webview (markdown-it, re-rendered per chunk)
```

- **`src/core/`** — pure, unit-tested logic: prompt templates, mode→prompt mapping, selection capture, `git diff --cached` classification.
- **`src/providers/`** — the `LLMProvider` interface, the `vscode.lm` implementation, and the registry. New providers implement one streaming method.
- **`src/webview/`** — the sidebar view provider (message bridge, CSP + nonce) and the vanilla-TS Signal Station UI.

Product truth lives in [`PRODUCT.md`](PRODUCT.md); the visual system is documented in [`DESIGN.md`](DESIGN.md).

---

## Development

```bash
npm install
npm run compile        # build the extension + webview bundles (esbuild)
npm run watch          # rebuild on change
npm run lint
npm run test:unit      # fast mocha unit tests (core logic, no VS Code host)
npm test               # integration tests via @vscode/test-electron
```

Then press **F5** in VS Code to launch the Extension Development Host with Rosetta Bridge loaded.

### Design preview

The webview can be rendered outside VS Code for visual review:

```bash
node scripts/preview.mjs   # generate preview pages for every state × theme
node scripts/shoot.mjs     # screenshot them with Playwright's isolated Chromium → .preview/shots/
```

---

## Roadmap

- **v1.1** — BYOK OpenAI/Anthropic providers (keys via `vscode.SecretStorage`), local Ollama support, cost/compliance warning detector, and custom prompt templates.

## License

MIT
