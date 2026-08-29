import type { DmnEditorStandaloneApi } from "@kie-tools/dmn-editor-standalone/dist";
import { describe, expect, it, vi } from "vitest";

import {
  closeDmnEditor,
  isDmnModelChanged,
  normalizeDmnXml,
  openDmnEditor,
} from "./dmnEditor";

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

  it("returns an empty model when the check has no saved DMN", () => {
    expect(normalizeDmnXml(null)).toBe("");
    expect(normalizeDmnXml(undefined)).toBe("");
    expect(normalizeDmnXml("")).toBe("");
  });
});

describe("isDmnModelChanged", () => {
  it("reports no change when the editor holds the stored model", () => {
    expect(isDmnModelChanged(DMN_1_6_XML, DMN_1_6_XML)).toBe(false);
  });

  it("reports no change for a stored model that is JSON-quoted", () => {
    expect(isDmnModelChanged(JSON.stringify(DMN_1_6_XML), DMN_1_6_XML)).toBe(
      false,
    );
  });

  it("reports no change for a check with no saved DMN", () => {
    expect(isDmnModelChanged(null, "")).toBe(false);
  });

  it("reports a change once the model is edited", () => {
    expect(
      isDmnModelChanged(DMN_1_6_XML, `${DMN_1_6_XML}\n<!-- edit -->`),
    ).toBe(true);
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
    const onError = vi.fn();
    const container = {} as Element;

    const openedEditor = openDmnEditor({
      container,
      dmnModel: JSON.stringify(DMN_1_6_XML),
      onDmnModelChange,
      onError,
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
    expect(options.onError).toBe(onError);
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

  it("ignores a content request that resolves after a newer one", async () => {
    let contentChangeCallback: ((isDirty: boolean) => void) | undefined;
    const resolvers: ((dmnModelXml: string) => void)[] = [];
    const editor = {
      getContent: vi.fn(
        () => new Promise<string>((resolve) => resolvers.push(resolve)),
      ),
      subscribeToContentChanges: vi.fn((callback) => {
        contentChangeCallback = callback;
        return callback;
      }),
    } as unknown as DmnEditorStandaloneApi;
    const onDmnModelChange = vi.fn();

    openDmnEditor({
      container: {} as Element,
      dmnModel: DMN_1_6_XML,
      onDmnModelChange,
      onError: vi.fn(),
      openEditor: vi.fn<OpenDmnEditor>(() => editor),
    });
    onDmnModelChange.mockClear();

    contentChangeCallback?.(true);
    contentChangeCallback?.(true);
    expect(resolvers).toHaveLength(2);

    // The newer request resolves first, then the stale one.
    resolvers[1]?.("newest");
    resolvers[0]?.("stale");

    await vi.waitFor(() => {
      expect(onDmnModelChange).toHaveBeenCalledWith("newest");
    });
    expect(onDmnModelChange).toHaveBeenCalledOnce();
  });

  it("reports a failed content request through onError", async () => {
    let contentChangeCallback: ((isDirty: boolean) => void) | undefined;
    const getContentError = new Error("editor iframe is gone");
    const editor = {
      getContent: vi.fn().mockRejectedValue(getContentError),
      subscribeToContentChanges: vi.fn((callback) => {
        contentChangeCallback = callback;
        return callback;
      }),
    } as unknown as DmnEditorStandaloneApi;
    const onDmnModelChange = vi.fn();
    const onError = vi.fn();

    openDmnEditor({
      container: {} as Element,
      dmnModel: DMN_1_6_XML,
      onDmnModelChange,
      onError,
      openEditor: vi.fn<OpenDmnEditor>(() => editor),
    });
    onDmnModelChange.mockClear();

    contentChangeCallback?.(true);

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(getContentError);
    });
    expect(onDmnModelChange).not.toHaveBeenCalled();
  });

  it("opens an empty editor for a check with no saved DMN", async () => {
    const editor = {
      subscribeToContentChanges: vi.fn((callback) => callback),
    } as unknown as DmnEditorStandaloneApi;
    const openEditor = vi.fn<OpenDmnEditor>(() => editor);
    const onDmnModelChange = vi.fn();

    openDmnEditor({
      container: {} as Element,
      dmnModel: null,
      onDmnModelChange,
      onError: vi.fn(),
      openEditor,
    });

    const options = openEditor.mock.calls[0]?.[0];
    expect(options).toBeDefined();
    if (!options) {
      throw new Error("Expected the standalone DMN editor to be opened");
    }
    await expect(options.initialContent).resolves.toBe("");
    expect(onDmnModelChange).toHaveBeenCalledWith("");
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
