import * as vscode from "vscode";
import { LLMProvider } from "./LLMProvider";
import { VSCodeLMProvider } from "./VSCodeLMProvider";

/**
 * Resolves the active {@link LLMProvider} from the `rosettaBridge.provider`
 * setting. Only `vscode-lm` is wired in this release; the other enum values
 * fall back to it with a note, so the config surface is forward-compatible.
 */
export class ProviderRegistry {
  private readonly providers = new Map<string, LLMProvider>();

  constructor() {
    this.register(new VSCodeLMProvider());
  }

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  /** Returns the configured provider, or the default when not yet implemented. */
  resolve(configValue?: string): { provider: LLMProvider; fallbackFrom?: string } {
    const id = configValue ?? this.readConfiguredId();
    const provider = this.providers.get(id);
    if (provider) {
      return { provider };
    }
    return { provider: this.getDefault(), fallbackFrom: id };
  }

  getDefault(): LLMProvider {
    const provider = this.providers.get("vscode-lm");
    if (!provider) {
      throw new Error("Default provider 'vscode-lm' is not registered.");
    }
    return provider;
  }

  private readConfiguredId(): string {
    return vscode.workspace
      .getConfiguration("rosettaBridge")
      .get<string>("provider", "vscode-lm");
  }
}
