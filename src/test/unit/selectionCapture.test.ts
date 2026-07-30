import * as assert from "node:assert";
import { captureCode, CaptureEditor } from "../../core/selectionCapture";

function fakeEditor(isEmpty: boolean, selectionText: string, docText: string): CaptureEditor {
  return {
    selection: { isEmpty },
    document: {
      getText: (range?: unknown) => (range ? selectionText : docText),
    },
  };
}

suite("selectionCapture", () => {
  test("returns selected text when a selection exists", () => {
    const result = captureCode(fakeEditor(false, "selected code", "whole document"));
    assert.strictEqual(result.text, "selected code");
    assert.strictEqual(result.source, "selection");
  });

  test("falls back to the whole document when nothing is selected", () => {
    const result = captureCode(fakeEditor(true, "selected code", "whole document"));
    assert.strictEqual(result.text, "whole document");
    assert.strictEqual(result.source, "document");
  });
});
