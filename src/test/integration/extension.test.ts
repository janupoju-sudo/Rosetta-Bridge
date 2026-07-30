import * as assert from "node:assert";
import * as vscode from "vscode";
import { ProviderRegistry } from "../../providers/ProviderRegistry";
import { VSCodeLMProvider } from "../../providers/VSCodeLMProvider";

const EXTENSION_ID = "jayesh-anupoju.rosetta-bridge";

suite("Rosetta Bridge integration", () => {
  test("extension activates", async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, "extension should be discoverable");
    await ext!.activate();
    assert.strictEqual(ext!.isActive, true);
  });

  test("both commands are registered", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("rosettaBridge.translateSelection"));
    assert.ok(commands.includes("rosettaBridge.summarizeStagedChanges"));
  });

  test("registry resolves the default vscode-lm provider", () => {
    const registry = new ProviderRegistry();
    const { provider } = registry.resolve("vscode-lm");
    assert.strictEqual(provider.id, "vscode-lm");
  });

  test("registry falls back to default for unimplemented providers", () => {
    const registry = new ProviderRegistry();
    const { provider, fallbackFrom } = registry.resolve("openai");
    assert.strictEqual(provider.id, "vscode-lm");
    assert.strictEqual(fallbackFrom, "openai");
  });

  test("VSCodeLMProvider reports unavailable when no Copilot model is present", async () => {
    // The bare test host has no Copilot extension, so pre-flight must return a
    // non-null reason string rather than throwing.
    const reason = await new VSCodeLMProvider().isAvailable();
    assert.ok(
      typeof reason === "string" && reason.length > 0,
      "expected a human-readable unavailability reason",
    );
  });

  test("translateSelection degrades gracefully with no editor or model", async () => {
    // No active editor + no language model must resolve (surfacing a notice in
    // the webview), never reject into the UI thread.
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand("rosettaBridge.translateSelection")),
    );
  });

  test("summarizeStagedChanges degrades gracefully with no workspace", async () => {
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand("rosettaBridge.summarizeStagedChanges")),
    );
  });
});
