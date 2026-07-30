# Rosetta Bridge — Session Handoff & Context Dump

**Last updated:** 2026-07-30
**Status:** V1.0 core + Git Diff built, working end-to-end in the Extension Development Host with real Copilot. Distinctive UI shipped. **Pushed to GitHub** (`janupoju-sudo/Rosetta-Bridge`, public). **Marketplace prep done** (packages cleanly). Not yet published.

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
    streaming.ts                DecodeMeta, StreamSink, runDecode (pure stream loop; unit-tested)
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

### A. Integration tests + verification (task #6)
- [x] **Integration suite passing** — `npm test` (`@vscode/test-electron`) runs **7 tests** green: extension activates, both commands registered, registry resolves + falls back, provider reports unavailable in a bare host, and both commands degrade gracefully (no editor / no model / no workspace) without throwing.
  - Fixed a tooling incompatibility along the way: bumped `@vscode/test-cli` `0.0.9→0.0.15` and `@vscode/test-electron` `2.4.0→3.1.0` (older runner looked for a binary named `Electron`; VS Code 1.131 ships `Code`, causing `spawn … ENOENT`). Cleared `.vscode-test/` cache to force a fresh download.
- [x] **Streaming pipeline covered** — extracted the decode loop from `Orchestrator` into a pure `runDecode(provider, messages, meta, sink, token)` in `src/core/streaming.ts` (behind a `StreamSink` interface; the orchestrator's sink forwards to the webview). Unit tests (`runDecode.test.ts`) with a stubbed provider assert: chunk order → done, `ProviderError` → `error` and no `done`, non-Error fallback message, and cancellation stops forwarding. No VS Code host needed. `DecodeMeta` moved into this module.
- [x] Manual F5 verification (done earlier this session): selection translate, whole-file fallback, channel switch, copy — all working with real Copilot.
- [ ] Staged-diff path still untested against a real repo *with staged changes* (this folder is now a git repo — stage something and run "Summarize Staged Changes" to verify).

**Full suite: 21 unit + 7 integration = 28 passing.**

### B. Polish
- [ ] Optionally regenerate the full screenshot set for docs (EXEC-first).
- [ ] Optional refactor: de-duplicate webview markup between `SidebarViewProvider.getHtml` and `scripts/preview.mjs`.
- [ ] Consider caching `vscode.lm` model selection / handling very large selections (token limits).

### C. Marketplace publishing prep ✅ DONE (2026-07-30) — not yet published
Prep completed and pushed (commit `a7c116f`); `vsce package` succeeds with zero warnings:
- [x] Added **`LICENSE`** (MIT, © 2026 Jayesh Anupoju) and **`CHANGELOG.md`** (1.0.0).
- [x] Added **`repository`**, `bugs`, `homepage` → `https://github.com/janupoju-sudo/Rosetta-Bridge`.
- [x] Added a **256×256 PNG marketplace `icon`** (`media/icon.png`, teal/amber bridge) + SVG source (`media/icon.svg`) + reproducible `scripts/render-icon.mjs`; wired `icon` + `galleryBanner` in package.json. (Activity-bar icon `media/rosetta.svg` kept separate.)
- [x] Tightened **`.vscodeignore`** — `.vsix` ships only `dist/`, `media/{icon.png,rosetta.svg}`, README, LICENSE, CHANGELOG, package.json.
- [x] Validated: **`rosetta-bridge-1.0.0.vsix`** built (11 files, ~78 KB, gitignored — regenerate with `npx @vscode/vsce package`).
- [ ] **STILL OPEN:** confirm **`publisher`** — package.json has `"publisher": "jayesh-anupoju"`, which must match the Marketplace publisher ID you create (or change one to align).

Publishing steps (account actions — user only; NOT done, do NOT run yet unless asked):
1. Azure DevOps → create **PAT** (scope: Marketplace → Manage, all orgs).
2. https://marketplace.visualstudio.com/manage → create **publisher** (ID must match package.json `publisher`).
3. `npm i -g @vscode/vsce` → `vsce login <publisher>` → `vsce package` → test `.vsix` (`code --install-extension rosetta-bridge-1.0.0.vsix`) → `vsce publish`.
4. **Also publish to Open VSX** (`ovsx publish …`) so **Cursor / VSCodium / Windsurf** users (the PRD's "vibe coders") can install it — those editors don't use the MS Marketplace.

### D. Future (PRD V1.1 — out of current scope)
- [ ] BYOK OpenAI/Anthropic providers via `vscode.SecretStorage`.
- [ ] Local Ollama provider.
- [ ] Cost/compliance warning detector.
- [ ] Custom prompt-template settings.

---

## 7. Open decisions for next session
- Marketplace **publisher ID** (must match `package.json` `"publisher": "jayesh-anupoju"` or update it) — needed before `vsce publish`.
- Whether to run the heavier `@vscode/test-electron` integration suite locally or in CI.
- Whether to `git init` this project *as its own working repo for the diff flow* — it's now a git repo (pushed to GitHub), so **Summarize Staged Changes can be tested here** once you stage a change.

**Resolved this session:** GitHub repo created + pushed (`https://github.com/janupoju-sudo/Rosetta-Bridge`, public, `main`); marketplace prep done (§6C).
