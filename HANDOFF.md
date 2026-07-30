# Rosetta Bridge — Session Handoff & Context Dump

**Last updated:** 2026-07-30
**Status:** V1.0 core + Git Diff built, working end-to-end in the Extension Development Host with real Copilot. Distinctive UI shipped. Not yet published.

---

## 1. What this project is

A VS Code extension that translates source code into business/plain-English value, with two "channels":

- **EXEC (executive)** — business impact, ROI, risk briefing for stakeholders. **Now the primary/default channel.**
- **PLAIN (vibeCoder)** — jargon-free walkthrough for non-technical founders.

Runs on the user's **GitHub Copilot** seat via the native `vscode.lm` API (zero config, zero hosting cost). Full spec in [`PRD.md`](PRD.md).

---

## 2. What we did this session (chronological)

1. **Brainstormed & planned** from PRD.md. Decisions locked:
   - Scope: **V1.0 core + Git Diff** (FR-2). BYOK/Ollama deferred.
   - Providers: **`vscode.lm` only**, behind an extensible `LLMProvider` interface.
   - Webview: **vanilla TS + HTML/CSS**, `markdown-it`, re-rendered per streamed chunk.
   - Testing: **unit + integration**.
   - Plan file: `/Users/jayanupoju/.claude/plans/look-through-the-prd-md-streamed-kazoo.md`
2. **Built the extension** (all compiling, type-checked, linted):
   - Scaffold: `package.json`, `tsconfig.json`, `esbuild.js` (two bundles: node extension + browser webview), `.vscodeignore`, ESLint, `.vscode/{launch,tasks}.json`.
   - Core (pure, unit-tested): `prompts.ts`, `modes.ts`, `selectionCapture.ts`, `gitDiff.ts` (+ `gitRunner.ts`).
   - Providers: `LLMProvider.ts` (interface + `buildMessages`), `VSCodeLMProvider.ts`, `ProviderRegistry.ts`.
   - Webview: `SidebarViewProvider.ts` (message bridge, CSP+nonce) + `webview/ui/{main.ts,styles.css}`.
   - Orchestrator in `extension.ts` (capture → pick channel → stream → post to webview), with error handling.
   - **17 unit tests passing** (`npm run test:unit`).
3. **Designed a distinctive UI** via the `impeccable` skill:
   - Wrote `PRODUCT.md` (product truth) and `DESIGN.md` (visual system).
   - Visual world = **"Signal Station / Codebook"** (impeccable seed key `c348e88d`, assigned direction #7). The panel is a *decoding station*, not a chat box.
   - Channels are **signal pennants** (CSS-drawn flags): EXEC = amber (`#e0912f`), PLAIN = teal (`#23b2a0`). Switching channels re-colors the whole accent system.
   - States: idle (channel legend), decoding (blinking cursor + intercept chip + tether), decoded (copyable), signal-lost (error notice).
4. **Screenshot loop** (Playwright isolated Chromium — see §5):
   - `scripts/preview.mjs` generates preview pages for every theme × state.
   - `scripts/shoot.mjs` screenshots them to `.preview/shots/`.
   - Iterations fixed: a real `[hidden]`-not-hiding bug (component `display` overrode the attribute — affected the actual extension), reworked idle into an onboarding legend, and removed 3 "side-tab accent border" AI-slop tells flagged by the impeccable detector (now returns clean `[]`).
5. **Wrote `README.md`** (marketplace-ready description).
6. **Got it running:** installed `GitHub.copilot` (Copilot Chat was already built-in), user signed in, tested via F5 — **works well**.
7. **Made EXEC the primary channel** (user request):
   - `rosettaBridge.defaultMode` default → `executive`; `extension.ts` fallback → `executive`.
   - Reordered channel buttons + idle legend: **CH·1 = EXEC** (active by default), **CH·2 = PLAIN**.
   - Body defaults to `channel-exec`; updated `preview.mjs` to match.

---

## 3. Key files & where things live

```
PRD.md                          product requirements (source of truth for scope)
PRODUCT.md                      impeccable product truth
DESIGN.md                       impeccable visual system (Signal Station world + durable rules)
README.md                       marketplace description
HANDOFF.md                      this file
package.json                    manifest: commands, view, config, scripts, deps
esbuild.js                      two-bundle build (dist/extension.js, dist/webview.js + .css)
src/
  extension.ts                  activate(), commands, Orchestrator (capture→stream→webview)
  core/
    prompts.ts                  VIBE_CODER_ / EXECUTIVE_ system prompts (from PRD §4)
    modes.ts                    Mode type, systemPromptForMode, coerceMode
    selectionCapture.ts         FR-1: selection → whole-doc fallback
    gitDiff.ts                  FR-2: git diff --cached classification (pure)
    gitRunner.ts                real child_process git runner
  providers/
    LLMProvider.ts              interface + ProviderError + buildMessages
    VSCodeLMProvider.ts         vscode.lm implementation
    ProviderRegistry.ts         config → provider (falls back to vscode-lm)
  webview/
    SidebarViewProvider.ts      WebviewViewProvider, message protocol, getHtml (markup)
    ui/main.ts                  webview logic (channels, streaming render, copy)
    ui/styles.css               Signal Station styles (direction contract in header comment)
  test/
    unit/*.test.ts              mocha unit tests (17, passing)
    integration/extension.test.ts  @vscode/test-electron suite (WRITTEN, NOT YET RUN)
scripts/
  preview.mjs                   generate webview preview pages (theme × state)
  shoot.mjs                     Playwright screenshots → .preview/shots/
media/rosetta.svg               monochrome activity-bar icon (user likes it — keep)
.preview/shots/                 current UI screenshots
```

**Note on markup duplication:** the webview body markup exists in BOTH `src/webview/SidebarViewProvider.ts` (`getHtml`) and `scripts/preview.mjs` (`BODY`). When changing markup, update both. (Possible future refactor: single source of truth.)

---

## 4. How to resume next session

```bash
cd /Users/jayanupoju/Documents/RosettaBridge
npm install                 # if fresh checkout
npm run compile             # build both bundles
npm run test:unit           # 17 tests, should pass
npm run lint                # clean
# Design preview loop:
node scripts/preview.mjs && node scripts/shoot.mjs   # → .preview/shots/
```

**To run the extension:** open the project in VS Code, press **F5** → `[Extension Development Host]` window. After code changes, **Cmd+R** in that window reloads the rebuilt bundle. Copilot must be signed in (already done on this machine).

**Commands:** `Rosetta Bridge: Translate Selection`, `Rosetta Bridge: Summarize Git Staged Changes`.

---

## 5. Environment notes / gotchas

- **Never `pkill -f "Brave Browser"`** — it kills the user's real browser (did this once this session; crashed their Brave). Use **Playwright's isolated Chromium** for screenshots (installed: `playwright` devDep + `~/Library/Caches/ms-playwright/chromium_headless_shell`).
- **Copilot Chat is a built-in extension** — it won't appear in `code --list-extensions`. `GitHub.copilot` was installed this session.
- `engines.vscode` is `^1.90.0` (the PRD said 1.85, but `vscode.lm` stabilized ~1.90).
- Providers `openai`/`anthropic`/`ollama` are enum-listed but **not implemented**; selecting one falls back to `vscode-lm` with a notice.

---

## 6. REMAINING TASKS

### A. Integration tests + verification (task #6 — not done)
- [ ] Run the integration suite: `npm test` (`@vscode/test-electron`) — downloads a full VS Code and launches it; not yet executed. Verify: extension activates, both commands registered, registry resolves/falls back, streaming reaches the webview.
- [ ] Manual F5 verification pass of all paths: selection, whole-file fallback, staged-diff (needs a **git repo** — this folder is NOT git-initialized yet, so "Summarize Staged Changes" currently returns "not a Git repository"), channel switch, copy, error states.
- [ ] Consider `git init` on this project so the diff flow is testable here.

### B. Polish
- [ ] Optionally regenerate the full screenshot set for docs (EXEC-first).
- [ ] Optional refactor: de-duplicate webview markup between `SidebarViewProvider.getHtml` and `scripts/preview.mjs`.
- [ ] Consider caching `vscode.lm` model selection / handling very large selections (token limits).

### C. Marketplace publishing prep (discussed, NOT started)
Before `vsce package` will succeed cleanly:
- [ ] Add a **`LICENSE`** file (README declares MIT; no file yet).
- [ ] Add **`repository`** field to package.json (need the GitHub repo URL).
- [ ] Add a **128×128 PNG marketplace `icon`** (current `media/rosetta.svg` is monochrome SVG — not valid as the gallery icon). Can render a colored bridge/pennant mark to PNG via the installed Chromium.
- [ ] Confirm **`publisher`** in package.json matches the Marketplace publisher ID to be created.

Publishing steps (account actions — user only):
1. Azure DevOps → create **PAT** (scope: Marketplace → Manage, all orgs).
2. https://marketplace.visualstudio.com/manage → create **publisher** (ID must match package.json).
3. `npm i -g @vscode/vsce` → `vsce login <publisher>` → `vsce package` → test `.vsix` → `vsce publish`.
4. **Also publish to Open VSX** (`ovsx publish …`) so **Cursor / VSCodium / Windsurf** users (the PRD's "vibe coders") can install it — those editors don't use the MS Marketplace.

### D. Future (PRD V1.1 — out of current scope)
- [ ] BYOK OpenAI/Anthropic providers via `vscode.SecretStorage`.
- [ ] Local Ollama provider.
- [ ] Cost/compliance warning detector.
- [ ] Custom prompt-template settings.

---

## 7. Open decisions for next session
- GitHub repo URL (for `repository` field + Open VSX namespace).
- Marketplace **publisher ID** (must match `package.json` `"publisher": "jayesh-anupoju"` or update it).
- Whether to `git init` this project now.
- Whether to run the heavier `@vscode/test-electron` integration suite locally or in CI.
