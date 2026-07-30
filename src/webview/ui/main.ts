import MarkdownIt from "markdown-it";
import "./styles.css";

/** Minimal VS Code webview API surface we use. */
interface VsCodeApi {
  postMessage(message: unknown): void;
}
declare function acquireVsCodeApi(): VsCodeApi;

interface DecodeMeta {
  source: string;
  channel: string;
}

type ToWebview =
  | { type: "start"; meta: DecodeMeta }
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "status"; message: string }
  | { type: "setMode"; mode: string };

const vscode = acquireVsCodeApi();
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const body = document.body;
const output = byId<HTMLDivElement>("output");
const decode = byId<HTMLDivElement>("decode");
const cursor = byId<HTMLSpanElement>("cursor");
const idle = byId<HTMLDivElement>("idle");
const notice = byId<HTMLDivElement>("notice");
const noticeText = byId<HTMLSpanElement>("notice-text");
const intercept = byId<HTMLDivElement>("intercept");
const interceptSource = byId<HTMLSpanElement>("intercept-source");
const tether = byId<HTMLDivElement>("tether");
const copyBtn = byId<HTMLButtonElement>("copy-btn");
const translateBtn = byId<HTMLButtonElement>("translate-btn");
const diffBtn = byId<HTMLButtonElement>("diff-btn");
const channelButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".channel"));

let accumulated = "";

translateBtn.addEventListener("click", () => vscode.postMessage({ type: "translate" }));
diffBtn.addEventListener("click", () => vscode.postMessage({ type: "summarizeDiff" }));

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(accumulated);
  copyBtn.classList.add("sent");
  const glyph = copyBtn.querySelector(".key-glyph")?.outerHTML ?? "";
  copyBtn.innerHTML = `${glyph}TRANSMITTED`;
  setTimeout(() => {
    copyBtn.classList.remove("sent");
    copyBtn.innerHTML = `${glyph}COPY TRANSMISSION`;
  }, 1300);
});

for (const btn of channelButtons) {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode ?? "vibeCoder";
    setActiveChannel(mode);
    vscode.postMessage({ type: "setMode", mode });
  });
}

window.addEventListener("message", (event: MessageEvent<ToWebview>) => {
  const message = event.data;
  switch (message.type) {
    case "start":
      beginDecode(message.meta);
      break;
    case "chunk":
      accumulated += message.text;
      render();
      break;
    case "done":
      endDecode();
      break;
    case "error":
      showNotice(message.message);
      break;
    case "status":
      // Non-fatal provider notes surface as a transient intercept hint.
      interceptSource.textContent = message.message;
      showIntercept();
      break;
    case "setMode":
      setActiveChannel(message.mode);
      break;
  }
});

function beginDecode(meta: DecodeMeta): void {
  accumulated = "";
  setActiveChannel(meta.channel);
  setBusy(true);
  interceptSource.textContent = meta.source;
  showIntercept();
  idle.hidden = true;
  notice.hidden = true;
  decode.hidden = false;
  cursor.hidden = false;
  copyBtn.hidden = true;
  render();
}

function endDecode(): void {
  setBusy(false);
  cursor.hidden = true;
  copyBtn.hidden = accumulated.trim().length === 0;
}

function showNotice(text: string): void {
  setBusy(false);
  accumulated = "";
  output.innerHTML = "";
  decode.hidden = true;
  cursor.hidden = true;
  idle.hidden = true;
  intercept.hidden = true;
  tether.hidden = true;
  copyBtn.hidden = true;
  noticeText.textContent = text;
  notice.hidden = false;
}

function showIntercept(): void {
  intercept.hidden = false;
  tether.hidden = false;
}

function render(): void {
  // Re-parse the full accumulated markdown on each chunk (per PRD FR-4.2).
  output.innerHTML = md.render(accumulated);
  decode.scrollTop = decode.scrollHeight;
}

function setBusy(value: boolean): void {
  translateBtn.disabled = value;
  diffBtn.disabled = value;
}

function setActiveChannel(mode: string): void {
  const channel = mode === "executive" ? "executive" : "vibeCoder";
  body.classList.toggle("channel-exec", channel === "executive");
  for (const btn of channelButtons) {
    const isActive = btn.dataset.mode === channel;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  }
}

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element #${id}`);
  }
  return el as T;
}

// Tell the extension we're mounted so it can push the initial channel.
vscode.postMessage({ type: "ready" });
