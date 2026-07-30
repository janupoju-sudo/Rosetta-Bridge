import * as vscode from "vscode";
import { ChatMessage, LLMProvider, ProviderError } from "./LLMProvider";

/**
 * Provider backed by the native VS Code Language Model API (`vscode.lm`),
 * which uses the user's GitHub Copilot seat (including Copilot Free).
 * Zero configuration, zero hosting cost — the default tier.
 */
export class VSCodeLMProvider implements LLMProvider {
  readonly id = "vscode-lm";
  readonly displayName = "VS Code Language Model (Copilot)";

  async isAvailable(): Promise<string | null> {
    if (!vscode.lm || typeof vscode.lm.selectChatModels !== "function") {
      return "The VS Code Language Model API is unavailable. Update VS Code to 1.90 or newer.";
    }
    try {
      const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
      if (models.length === 0) {
        return "No language model is available. Sign in to GitHub Copilot (the free tier works) and try again.";
      }
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not query available language models.";
    }
  }

  async *stream(messages: ChatMessage[], token: vscode.CancellationToken): AsyncIterable<string> {
    const [model] = await vscode.lm.selectChatModels({ vendor: "copilot" });
    if (!model) {
      throw new ProviderError(
        "No Copilot language model is available. Sign in to GitHub Copilot and try again.",
      );
    }

    // `vscode.lm` has no dedicated system role, so system instructions are
    // prepended to the user turn.
    const lmMessages = this.toLmMessages(messages);

    try {
      const response = await model.sendRequest(lmMessages, {}, token);
      for await (const fragment of response.text) {
        yield fragment;
      }
    } catch (err) {
      if (err instanceof vscode.LanguageModelError) {
        throw new ProviderError(this.describeLmError(err), err);
      }
      if (err instanceof vscode.CancellationError || token.isCancellationRequested) {
        return;
      }
      throw new ProviderError(
        err instanceof Error ? err.message : "The language model request failed.",
        err,
      );
    }
  }

  private toLmMessages(messages: ChatMessage[]): vscode.LanguageModelChatMessage[] {
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const user = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n\n");

    const combined = system ? `${system}\n\n---\n\nCODE / DIFF TO ANALYZE:\n\n${user}` : user;
    return [vscode.LanguageModelChatMessage.User(combined)];
  }

  private describeLmError(err: vscode.LanguageModelError): string {
    switch (err.code) {
      case "NoPermissions":
        return "Rosetta Bridge needs your permission to use the language model. Approve the prompt and try again.";
      case "Blocked":
        return "The request was blocked by the model's content filter.";
      default:
        return err.message || "The language model request failed.";
    }
  }
}
