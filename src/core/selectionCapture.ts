/**
 * FR-1: capture the code to translate from the active editor.
 * Uses selected text when a selection exists, otherwise the whole document.
 *
 * Defined against minimal structural interfaces (rather than importing
 * `vscode`) so the logic is unit-testable with plain fakes. A real
 * `vscode.TextEditor` satisfies `CaptureEditor`.
 */

export interface CaptureSelection {
  readonly isEmpty: boolean;
}

export interface CaptureDocument {
  getText(range?: unknown): string;
}

export interface CaptureEditor {
  readonly selection: CaptureSelection;
  readonly document: CaptureDocument;
}

export interface CapturedCode {
  text: string;
  /** Where the text came from — useful for status messaging. */
  source: "selection" | "document";
}

export function captureCode(editor: CaptureEditor): CapturedCode {
  if (!editor.selection.isEmpty) {
    return { text: editor.document.getText(editor.selection), source: "selection" };
  }
  return { text: editor.document.getText(), source: "document" };
}
