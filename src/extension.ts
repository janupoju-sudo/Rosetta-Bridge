import * as vscode from "vscode";
import { captureCode } from "./core/selectionCapture";
import { getStagedDiff, messageForResult } from "./core/gitDiff";
import { spawnGitRunner } from "./core/gitRunner";
import { coerceMode, Mode, systemPromptForMode } from "./core/modes";
import { DecodeMeta, runDecode, StreamSink } from "./core/streaming";
import { buildMessages } from "./providers/LLMProvider";
import { ProviderRegistry } from "./providers/ProviderRegistry";
import { SidebarViewProvider } from "./webview/SidebarViewProvider";

export function activate(context: vscode.ExtensionContext): void {
  const registry = new ProviderRegistry();
  const initialMode = coerceMode(
    vscode.workspace.getConfiguration("rosettaBridge").get<string>("defaultMode", "executive"),
  );

  const sidebar = new SidebarViewProvider(context.extensionUri, initialMode);
  const orchestrator = new Orchestrator(registry, sidebar);

  sidebar.setHandlers({
    onTranslate: () => void orchestrator.translateSelection(),
    onSummarizeDiff: () => void orchestrator.summarizeStagedChanges(),
    onModeChanged: () => {
      /* mode is tracked inside the sidebar; nothing else to do */
    },
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarViewProvider.viewId, sidebar),
    vscode.commands.registerCommand("rosettaBridge.translateSelection", () =>
      orchestrator.translateSelection(),
    ),
    vscode.commands.registerCommand("rosettaBridge.summarizeStagedChanges", () =>
      orchestrator.summarizeStagedChanges(),
    ),
  );
}

export function deactivate(): void {
  /* nothing to clean up */
}

/**
 * Coordinates input capture → provider streaming → webview output for both
 * commands. Central place for error handling so failures reach the UI as
 * messages rather than exceptions (PRD §6).
 */
class Orchestrator {
  private active?: vscode.CancellationTokenSource;

  constructor(
    private readonly registry: ProviderRegistry,
    private readonly sidebar: SidebarViewProvider,
  ) {}

  async translateSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      await this.fail("Open a file and place your cursor in it, then try again.");
      return;
    }

    const captured = captureCode(editor);
    if (captured.text.trim().length === 0) {
      await this.fail("There's no code to translate — the file is empty.");
      return;
    }

    const fileName = editor.document.fileName.split(/[\\/]/).pop() || "untitled";
    const lines = captured.text.split("\n").length;
    const scope = captured.source === "selection" ? "selection" : "whole file";
    await this.run(captured.text, { sourceLabel: `${fileName} · ${scope} · ${lines} ln` });
  }

  async summarizeStagedChanges(): Promise<void> {
    const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!cwd) {
      await this.fail("Open a folder or workspace to summarize Git changes.");
      return;
    }

    await this.sidebar.reveal();
    this.sidebar.showStatus("Reading staged changes…");

    const result = await getStagedDiff(spawnGitRunner, cwd);
    if (result.kind !== "diff") {
      await this.fail(messageForResult(result));
      return;
    }

    // Git diffs are always framed for stakeholders — force Executive mode.
    const lines = result.diff.split("\n").length;
    await this.run(result.diff, {
      sourceLabel: `staged diff · ${lines} ln`,
      forcedMode: "executive",
    });
  }

  private async run(input: string, opts: { sourceLabel: string; forcedMode?: Mode }): Promise<void> {
    this.active?.cancel();
    this.active = new vscode.CancellationTokenSource();
    const token = this.active.token;

    const { provider, fallbackFrom } = this.registry.resolve();
    const unavailable = await provider.isAvailable();
    if (unavailable) {
      await this.fail(unavailable);
      return;
    }
    if (fallbackFrom) {
      this.sidebar.showStatus(
        `Provider "${fallbackFrom}" isn't available yet — using ${provider.displayName}.`,
      );
    }

    const mode = opts.forcedMode ?? this.sidebar.mode;
    const messages = buildMessages(systemPromptForMode(mode), input);
    const meta: DecodeMeta = { source: opts.sourceLabel, channel: mode };

    await this.sidebar.reveal();
    await runDecode(provider, messages, meta, this.sink, token);
  }

  /** Forwards the decode loop's output to the webview. */
  private get sink(): StreamSink {
    return {
      start: (meta) => this.sidebar.startStream(meta),
      chunk: (text) => this.sidebar.appendChunk(text),
      done: () => this.sidebar.endStream(),
      error: (message) => this.sidebar.showError(message),
    };
  }

  private async fail(message: string): Promise<void> {
    await this.sidebar.reveal();
    this.sidebar.showError(message);
  }
}
