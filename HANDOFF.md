# Rosetta Bridge — Session Handoff & Context Dump

**Last updated:** 2026-07-30
**Status:** 🚀 **PUBLISHED** — `Jayanupoju.rosetta-bridge v1.0.0` is live on the VS Code Marketplace. V1.0 core + Git Diff, working end-to-end with real Copilot, distinctive UI. On GitHub (`janupoju-sudo/Rosetta-Bridge`, public), 28 tests passing.

- **Marketplace listing:** https://marketplace.visualstudio.com/items?itemName=Jayanupoju.rosetta-bridge
- **Publisher hub:** https://marketplace.visualstudio.com/manage/publishers/Jayanupoju/extensions/rosetta-bridge/hub
- **Install:** `code --install-extension Jayanupoju.rosetta-bridge` (or Extensions → search "Rosetta Bridge")

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
- [x] **Real staged-diff pipeline verified** — ran the production `spawnGitRunner` + `getStagedDiff` against this repo: a staged change classifies as `kind:diff` (valid unified diff), nothing staged classifies as `kind:empty` with the friendly notice. Working tree left clean. The full in-panel LLM summary uses the identical `run()→runDecode()` path as Translate Selection (already confirmed live), so only a cosmetic F5 glance remains optional.
- [ ] *(Optional future)* durable integration test that creates a temp git repo and runs the real runner, instead of the one-off manual check above.

**Full suite: 21 unit + 7 integration = 28 passing.** Task #6 complete.

### B. Polish
- [ ] **CI workflow (planned — do next session).** Add `.github/workflows/ci.yml` running on push/PR to `main`:
  - `npm ci`; `npm run lint`; `npm run compile-tests`; `npm run test:unit`.
  - Integration tests (`npm test`, `@vscode/test-electron`) need a display — run them under `xvfb-run` on `ubuntu-latest` (headless), or keep integration local-only and run just lint + unit + type-check in CI.
  - Node 20; cache npm. Optionally a separate **release** job on tag `v*` that runs `npx @vscode/vsce publish -p ${{ secrets.VSCE_PAT }}` (store the PAT as the repo secret `VSCE_PAT`, never in the repo). Consider `ovsx publish` for Open VSX in the same job.
  - Add a build badge to `README.md`.
- [ ] Optionally regenerate the full screenshot set for docs (EXEC-first).
- [ ] Optional refactor: de-duplicate webview markup between `SidebarViewProvider.getHtml` and `scripts/preview.mjs`.
- [ ] Consider caching `vscode.lm` model selection / handling very large selections (token limits).

### C. Marketplace publishing ✅ PUBLISHED (2026-07-30)
**`Jayanupoju.rosetta-bridge v1.0.0` is live.** Published with `npx @vscode/vsce publish` after `npx @vscode/vsce login Jayanupoju` (used `npx`, not a global install, to avoid an EACCES on `/usr/local/lib`). Prep (committed `a7c116f`); `vsce package` succeeds with zero warnings:
- [x] Added **`LICENSE`** (MIT, © 2026 Jayesh Anupoju) and **`CHANGELOG.md`** (1.0.0).
- [x] Added **`repository`**, `bugs`, `homepage` → `https://github.com/janupoju-sudo/Rosetta-Bridge`.
- [x] Added a **256×256 PNG marketplace `icon`** (`media/icon.png`, teal/amber bridge) + SVG source (`media/icon.svg`) + reproducible `scripts/render-icon.mjs`; wired `icon` + `galleryBanner` in package.json. (Activity-bar icon `media/rosetta.svg` kept separate.)
- [x] Tightened **`.vscodeignore`** — `.vsix` ships only `dist/`, `media/{icon.png,rosetta.svg}`, README, LICENSE, CHANGELOG, package.json.
- [x] Validated: **`rosetta-bridge-1.0.0.vsix`** built (11 files, ~78 KB, gitignored — regenerate with `npx @vscode/vsce package`).
- [x] **Publisher `Jayanupoju`** created on the Marketplace; `package.json` `"publisher": "Jayanupoju"` (extension id `Jayanupoju.rosetta-bridge`; integration test matches).
- [x] **Azure DevOps PAT** created (org `janupoju`, free tier) with **Marketplace → Manage** scope, **All accessible organizations**.
- [x] **Published** via `npx @vscode/vsce login Jayanupoju` → `npx @vscode/vsce publish`.

**Publish future updates:** bump version + re-publish in one step — `npx @vscode/vsce publish patch` (or `minor` / `major`). PAT is cached from `vsce login`; if it expires, re-run login with a fresh PAT.

- [ ] **Open VSX (still TODO)** — publish so **Cursor / VSCodium / Windsurf** users (the PRD's "vibe coders") can install it; those editors don't use the MS Marketplace. Steps: create a free token + `Jayanupoju` namespace at https://open-vsx.org (GitHub login, no Azure), then `npx ovsx publish rosetta-bridge-1.0.0.vsix -p <token>`.

⚠️ **Security note:** during this session a PAT was accidentally pasted into chat and should have been revoked; only ever paste a PAT at the `vsce login` prompt in a private terminal, never in chat/files/commits.

### D. Future (PRD V1.1 — out of current scope)
- [ ] BYOK OpenAI/Anthropic providers via `vscode.SecretStorage`.
- [ ] Local Ollama provider.
- [ ] Cost/compliance warning detector.
- [ ] Custom prompt-template settings.

---

## 7. Next session / open items
- **Set up the CI workflow** (see §6B) — the main planned task.
- **Publish to Open VSX** for Cursor/VSCodium/Windsurf users (see §6C).
- Optionally verify the **published** build installs & runs in a clean VS Code (`code --install-extension Jayanupoju.rosetta-bridge`).

**Resolved this session:** built V1.0 + Git Diff; distinctive Signal Station UI (EXEC-primary); 28 tests passing; GitHub repo created + pushed (`janupoju-sudo/Rosetta-Bridge`); **published to the VS Code Marketplace as `Jayanupoju.rosetta-bridge v1.0.0`**.
