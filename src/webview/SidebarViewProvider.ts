import * as vscode from "vscode";
import { coerceMode, Mode } from "../core/modes";
import type { DecodeMeta } from "../core/streaming";

export type { DecodeMeta };

/** Messages the extension sends to the webview. */
type ToWebview =
  | { type: "start"; meta: DecodeMeta }
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "status"; message: string }
  | { type: "setMode"; mode: Mode };

/** Messages the webview sends back to the extension. */
type FromWebview =
  | { type: "ready" }
  | { type: "translate" }
  | { type: "summarizeDiff" }
  | { type: "setMode"; mode: string };

/** Actions the orchestrator registers to respond to webview interactions. */
export interface SidebarHandlers {
  onTranslate(): void;
  onSummarizeDiff(): void;
  onModeChanged(mode: Mode): void;
}

/**
 * Hosts the sidebar webview (FR-4). Owns the message bridge in both directions
 * and exposes typed methods the orchestrator uses to stream output in.
 */
export class SidebarViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = "rosettaBridge.panel";

  private view?: vscode.WebviewView;
  private handlers?: SidebarHandlers;
  private currentMode: Mode;

  constructor(
    private readonly extensionUri: vscode.Uri,
    initialMode: Mode,
  ) {
    this.currentMode = initialMode;
  }

  setHandlers(handlers: SidebarHandlers): void {
    this.handlers = handlers;
  }

  get mode(): Mode {
    return this.currentMode;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "dist"),
        vscode.Uri.joinPath(this.extensionUri, "media"),
      ],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: FromWebview) => {
      switch (message.type) {
        case "ready":
          this.post({ type: "setMode", mode: this.currentMode });
          break;
        case "translate":
          this.handlers?.onTranslate();
          break;
        case "summarizeDiff":
          this.handlers?.onSummarizeDiff();
          break;
        case "setMode":
          this.currentMode = coerceMode(message.mode);
          this.handlers?.onModeChanged(this.currentMode);
          break;
      }
    });
  }

  /** Reveals the sidebar view so streamed output is visible. */
  async reveal(): Promise<void> {
    await vscode.commands.executeCommand(`${SidebarViewProvider.viewId}.focus`);
  }

  startStream(meta: DecodeMeta): void {
    this.post({ type: "start", meta });
  }

  appendChunk(text: string): void {
    this.post({ type: "chunk", text });
  }

  endStream(): void {
    this.post({ type: "done" });
  }

  showError(message: string): void {
    this.post({ type: "error", message });
  }

  showStatus(message: string): void {
    this.post({ type: "status", message });
  }

  private post(message: ToWebview): void {
    this.view?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview.css"),
    );
    const csp = [
      `default-src 'none'`,
      `img-src ${webview.cspSource} https: data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
    ].join("; ");

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
  <title>Rosetta Bridge</title>
</head>
<body class="station channel-exec">
  <header class="masthead">
    <span class="mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 5h7a3 3 0 0 1 3 3v11" />
        <path d="M20 19h-7a3 3 0 0 1-3-3V5" />
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
      <span class="channel-code">CH·1</span>
      <span class="channel-name">EXEC</span>
    </button>
    <button type="button" class="channel" data-mode="vibeCoder" role="tab" aria-selected="false">
      <span class="pennant pennant-plain" aria-hidden="true"></span>
      <span class="channel-code">CH·2</span>
      <span class="channel-name">PLAIN</span>
    </button>
  </div>

  <div class="keys">
    <button type="button" id="translate-btn" class="key key-primary">
      <span class="key-glyph" aria-hidden="true">⧉</span>DECODE SELECTION
    </button>
    <button type="button" id="diff-btn" class="key key-secondary">
      <span class="key-glyph" aria-hidden="true">⎇</span>DECODE STAGED DIFF
    </button>
  </div>

  <section class="feed" aria-live="polite">
    <div id="intercept" class="intercept" hidden>
      <span class="intercept-label">INTERCEPT</span>
      <span id="intercept-source" class="intercept-source"></span>
    </div>
    <div id="tether" class="tether" hidden></div>

    <div id="idle" class="plate">
      <div class="plate-top">
        <span class="plate-glyph" aria-hidden="true">◈</span>
        <span class="plate-line">STATION IDLE</span>
      </div>
      <p class="plate-sub">Select code — or stage a diff — pick a channel, and decode.</p>
      <div class="legend">
        <div class="legend-row">
          <span class="pennant pennant-exec" aria-hidden="true"></span>
          <span class="legend-text">
            <span class="legend-name">CH·1 · EXEC</span>
            <span class="legend-desc">Business impact, ROI &amp; risk for stakeholders.</span>
          </span>
        </div>
        <div class="legend-row">
          <span class="pennant pennant-plain" aria-hidden="true"></span>
          <span class="legend-text">
            <span class="legend-name">CH·2 · PLAIN</span>
            <span class="legend-desc">Plain-English walkthrough for non-coders.</span>
          </span>
        </div>
      </div>
    </div>

    <div id="notice" class="notice" role="status" hidden>
      <span class="notice-label">SIGNAL LOST</span>
      <span id="notice-text" class="notice-text"></span>
    </div>

    <div id="decode" class="decode" hidden>
      <div id="output" class="output markdown-body"></div>
      <span id="cursor" class="cursor" hidden></span>
    </div>
  </section>

  <footer class="transmit">
    <button type="button" id="copy-btn" class="key key-transmit" hidden>
      <span class="key-glyph" aria-hidden="true">⇪</span>COPY TRANSMISSION
    </button>
  </footer>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
