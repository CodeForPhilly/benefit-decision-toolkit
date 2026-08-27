import type { DmnEditorStandaloneApi } from "@kie-tools/dmn-editor-standalone/dist";
import { describe, expect, it, vi } from "vitest";

import { closeDmnEditor, normalizeDmnXml, openDmnEditor } from "./dmnEditor";

type OpenDmnEditor =
  typeof import("@kie-tools/dmn-editor-standalone/dist").open;

const DMN_1_6_XML = `<?xml version="1.0" encoding="UTF-8"?>
<dmn:definitions xmlns:dmn="https://www.omg.org/spec/DMN/20240513/MODEL/"
  xmlns:feel="https://www.omg.org/spec/DMN/20240513/FEEL/"
  id="dmn-1-6" name="DMN 1.6" namespace="https://example.gov/dmn-1-6"
  typeLanguage="https://www.omg.org/spec/DMN/20240513/FEEL/" />`;

describe("normalizeDmnXml", () => {
  it("preserves ordinary DMN XML", () => {
    expect(normalizeDmnXml(DMN_1_6_XML)).toBe(DMN_1_6_XML);
  });

  it("decodes JSON-encoded DMN XML", () => {
    expect(normalizeDmnXml(JSON.stringify(DMN_1_6_XML))).toBe(DMN_1_6_XML);
  });
});

describe("openDmnEditor", () => {
  it("loads and propagates changes for a DMN 1.6 model", async () => {
    let contentChangeCallback: ((isDirty: boolean) => void) | undefined;
    const subscribeToContentChanges = vi.fn((callback) => {
      contentChangeCallback = callback;
      return callback;
    });
    const editor = {
      getContent: vi.fn().mockResolvedValue(`${DMN_1_6_XML}\n<!-- changed -->`),
      subscribeToContentChanges,
    } as unknown as DmnEditorStandaloneApi;
    const openEditor = vi.fn<OpenDmnEditor>(() => editor);
    const onDmnModelChange = vi.fn();
    const container = {} as Element;

    const openedEditor = openDmnEditor({
      container,
      dmnModel: JSON.stringify(DMN_1_6_XML),
      onDmnModelChange,
      openEditor,
    });

    const options = openEditor.mock.calls[0]?.[0];
    expect(options).toBeDefined();
    if (!options) {
      throw new Error("Expected the standalone DMN editor to be opened");
    }
    expect(options.container).toBe(container);
    await expect(options.initialContent).resolves.toBe(DMN_1_6_XML);
    expect(
      options.initialFileNormalizedPosixPathRelativeToTheWorkspaceRoot,
    ).toBe("model.dmn");
    expect(options.readOnly).toBe(false);
    expect(options.resources).toEqual(new Map());
    expect(onDmnModelChange).toHaveBeenCalledWith(DMN_1_6_XML);
    expect(openedEditor.editor).toBe(editor);
    expect(openedEditor.contentChangeSubscription).toBe(contentChangeCallback);

    contentChangeCallback?.(true);
    await vi.waitFor(() => {
      expect(onDmnModelChange).toHaveBeenLastCalledWith(
        `${DMN_1_6_XML}\n<!-- changed -->`,
      );
    });
  });

  it("unsubscribes and closes the editor during cleanup", () => {
    const contentChangeSubscription = vi.fn();
    const editor = {
      close: vi.fn(),
      unsubscribeToContentChanges: vi.fn(),
    } as unknown as DmnEditorStandaloneApi;

    closeDmnEditor(editor, contentChangeSubscription);

    expect(editor.unsubscribeToContentChanges).toHaveBeenCalledWith(
      contentChangeSubscription,
    );
    expect(editor.close).toHaveBeenCalledOnce();
  });
});
