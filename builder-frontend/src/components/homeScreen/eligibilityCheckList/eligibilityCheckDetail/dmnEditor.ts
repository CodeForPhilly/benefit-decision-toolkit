import type { DmnEditorStandaloneApi } from "@kie-tools/dmn-editor-standalone/dist";

const DMN_MODEL_FILE_NAME = "model.dmn";

export type OpenDmnEditor =
  typeof import("@kie-tools/dmn-editor-standalone/dist").open;

export const normalizeDmnXml = (xml: string | null | undefined): string => {
  if (!xml) {
    return "";
  }

  if (!xml.startsWith('"') || !xml.endsWith('"')) {
    return xml;
  }

  try {
    const parsedXml: unknown = JSON.parse(xml);
    return typeof parsedXml === "string" ? parsedXml : xml;
  } catch {
    return xml.slice(1, -1);
  }
};

export const openDmnEditor = ({
  container,
  dmnModel,
  onDmnModelChange,
  onError,
  openEditor,
}: {
  container: Element;
  dmnModel: string | null | undefined;
  onDmnModelChange: (dmnModelXml: string) => void;
  onError: () => void;
  openEditor: OpenDmnEditor;
}): {
  editor: DmnEditorStandaloneApi;
  contentChangeSubscription: (isDirty: boolean) => void;
} => {
  const initialDmnModel = normalizeDmnXml(dmnModel);
  const editor = openEditor({
    container,
    initialContent: Promise.resolve(initialDmnModel),
    initialFileNormalizedPosixPathRelativeToTheWorkspaceRoot:
      DMN_MODEL_FILE_NAME,
    resources: new Map(),
    readOnly: false,
    onError,
  });

  onDmnModelChange(initialDmnModel);

  // getContent() is an async round-trip to the editor iframe, so two edits in
  // quick succession can resolve out of order. Only the newest request wins.
  let latestContentRequestId = 0;
  const contentChangeSubscription = editor.subscribeToContentChanges(() => {
    const contentRequestId = ++latestContentRequestId;
    void editor
      .getContent()
      .then((dmnModelXml) => {
        if (contentRequestId === latestContentRequestId) {
          onDmnModelChange(dmnModelXml);
        }
      })
      .catch(onError);
  });

  return { editor, contentChangeSubscription };
};

export const closeDmnEditor = (
  editor: DmnEditorStandaloneApi | undefined,
  contentChangeSubscription: ((isDirty: boolean) => void) | undefined,
) => {
  if (editor && contentChangeSubscription) {
    editor.unsubscribeToContentChanges(contentChangeSubscription);
  }
  editor?.close();
};
