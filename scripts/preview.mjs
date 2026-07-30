// Renders the built webview bundle in a standalone page across theme × state,
// so the Signal Station UI can be screenshotted without the VS Code host.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, ".preview");
mkdirSync(outDir, { recursive: true });

const css = readFileSync(join(root, "dist", "webview.css"), "utf8");
const js = readFileSync(join(root, "dist", "webview.js"), "utf8");

// Body markup — mirrors SidebarViewProvider.getHtml (inline SVG, no webview URIs).
const BODY = `
<header class="masthead">
  <span class="mark" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 5h7a3 3 0 0 1 3 3v11" /><path d="M20 19h-7a3 3 0 0 1-3-3V5" />
      <circle cx="6" cy="18" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="6" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  </span>
  <span class="wordmark">ROSETTA BRIDGE</span>
  <span class="station-tag">STATION</span>
</header>
<div class="channels" role="tablist" aria-label="Decode channel">
  <button type="button" class="channel active" data-mode="executive" role="tab" aria-selected="true">
    <span class="pennant pennant-exec" aria-hidden="true"></span>
    <span class="channel-code">CH·1</span><span class="channel-name">EXEC</span>
  </button>
  <button type="button" class="channel" data-mode="vibeCoder" role="tab" aria-selected="false">
    <span class="pennant pennant-plain" aria-hidden="true"></span>
    <span class="channel-code">CH·2</span><span class="channel-name">PLAIN</span>
  </button>
</div>
<div class="keys">
  <button type="button" id="translate-btn" class="key key-primary"><span class="key-glyph" aria-hidden="true">⧉</span>DECODE SELECTION</button>
  <button type="button" id="diff-btn" class="key key-secondary"><span class="key-glyph" aria-hidden="true">⎇</span>DECODE STAGED DIFF</button>
</div>
<section class="feed" aria-live="polite">
  <div id="intercept" class="intercept" hidden><span class="intercept-label">INTERCEPT</span><span id="intercept-source" class="intercept-source"></span></div>
  <div id="tether" class="tether" hidden></div>
  <div id="idle" class="plate">
    <div class="plate-top"><span class="plate-glyph" aria-hidden="true">◈</span><span class="plate-line">STATION IDLE</span></div>
    <p class="plate-sub">Select code — or stage a diff — pick a channel, and decode.</p>
    <div class="legend">
      <div class="legend-row"><span class="pennant pennant-exec" aria-hidden="true"></span><span class="legend-text"><span class="legend-name">CH·1 · EXEC</span><span class="legend-desc">Business impact, ROI &amp; risk for stakeholders.</span></span></div>
      <div class="legend-row"><span class="pennant pennant-plain" aria-hidden="true"></span><span class="legend-text"><span class="legend-name">CH·2 · PLAIN</span><span class="legend-desc">Plain-English walkthrough for non-coders.</span></span></div>
    </div>
  </div>
  <div id="notice" class="notice" role="status" hidden><span class="notice-label">SIGNAL LOST</span><span id="notice-text" class="notice-text"></span></div>
  <div id="decode" class="decode" hidden><div id="output" class="output markdown-body"></div><span id="cursor" class="cursor" hidden></span></div>
</section>
<footer class="transmit">
  <button type="button" id="copy-btn" class="key key-transmit" hidden><span class="key-glyph" aria-hidden="true">⇪</span>COPY TRANSMISSION</button>
</footer>`;

const THEMES = {
  dark: `
    --vscode-font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    --vscode-font-size: 13px;
    --vscode-foreground: #cccccc;
    --vscode-sideBar-background: #1c1c1c;
    --vscode-editor-background: #1e1e1e;
    --vscode-editor-font-family: "SF Mono", Menlo, Monaco, monospace;
    --vscode-panel-border: #2b2b2b;
    --vscode-textCodeBlock-background: #2a2a2a;
    --vscode-errorForeground: #f14c4c;
    --vscode-textLink-foreground: #4daafc;`,
  light: `
    --vscode-font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    --vscode-font-size: 13px;
    --vscode-foreground: #3b3b3b;
    --vscode-sideBar-background: #f6f6f6;
    --vscode-editor-background: #ffffff;
    --vscode-editor-font-family: "SF Mono", Menlo, Monaco, monospace;
    --vscode-panel-border: #dcdcdc;
    --vscode-textCodeBlock-background: #eeeeee;
    --vscode-errorForeground: #e51400;
    --vscode-textLink-foreground: #005fb8;`,
};

const PLAIN_MD = `## 💡 Core Purpose
This code signs a user in and hands back a pass so the app remembers who they are.

## 🔄 Step-by-Step Logic Flow
1. It takes the email and password the person typed.
2. It checks them against the records on file, like a bouncer with a guest list.
3. If they match, it prints a temporary wristband (a token) that expires in a day.

## ⚠️ Safety & Cost Watchouts
- **Calls an outside service** to send a login email — that vendor bills per message.
- The wristband is stored in the browser; clear it on sign-out.`;

const EXEC_MD = `## 🎯 Executive Summary
Hardens sign-in so peak-hour logins stop failing — protecting conversion and trust.

## 📊 Business Impact & ROI
- **Cost & Efficiency:** Caches sessions, cutting auth-server load ~40% at peak.
- **Risk & Security:** Patches a token-expiry gap flagged in the last audit.

## 📝 Ready-to-Share Stakeholder Briefing
- Login reliability improved ahead of the launch campaign.
- Closes an outstanding security-audit finding.
- No user-facing changes; ships behind the current release.`;

const STATES = {
  idle: `/* default */`,
  "decoding-plain": `
    fire({ type: "start", meta: { source: "auth.ts · selection · 42 ln", channel: "vibeCoder" } });
    fire({ type: "chunk", text: ${JSON.stringify(PLAIN_MD.split("\n").slice(0, 6).join("\n"))} });`,
  "decoded-plain": `
    fire({ type: "start", meta: { source: "auth.ts · selection · 42 ln", channel: "vibeCoder" } });
    fire({ type: "chunk", text: ${JSON.stringify(PLAIN_MD)} });
    fire({ type: "done" });`,
  "decoded-exec": `
    fire({ type: "start", meta: { source: "staged diff · 118 ln", channel: "executive" } });
    fire({ type: "chunk", text: ${JSON.stringify(EXEC_MD)} });
    fire({ type: "done" });`,
  "signal-lost": `
    fire({ type: "error", message: "No language model is available. Sign in to GitHub Copilot (the free tier works) and try again." });`,
};

function page(theme, stateScript) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  :root{${THEMES[theme]}}
  html,body{margin:0}
  /* freeze transitions/animations for deterministic screenshots */
  *{transition:none !important; animation:none !important}
  ${css}
</style></head>
<body class="station channel-exec">
${BODY}
<script>window.acquireVsCodeApi=function(){return {postMessage:function(){}}};</script>
<script>${js}</script>
<script>
  function fire(msg){ window.dispatchEvent(new MessageEvent("message",{data:msg})); }
  ${stateScript}
</script>
</body></html>`;
}

const files = [];
for (const theme of Object.keys(THEMES)) {
  for (const [state, script] of Object.entries(STATES)) {
    const name = `${theme}__${state}.html`;
    writeFileSync(join(outDir, name), page(theme, script));
    files.push(name);
  }
}
console.log(files.join("\n"));
