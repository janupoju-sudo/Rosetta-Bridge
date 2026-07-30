import * as assert from "node:assert";
import * as vscode from "vscode";
import { ProviderRegistry } from "../../providers/ProviderRegistry";

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
});
