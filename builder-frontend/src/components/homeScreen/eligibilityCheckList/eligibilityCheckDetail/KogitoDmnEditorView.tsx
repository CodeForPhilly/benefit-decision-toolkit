import type { DmnEditorStandaloneApi } from "@kie-tools/dmn-editor-standalone/dist";
import { Accessor, onCleanup, onMount } from "solid-js";

import { closeDmnEditor, openDmnEditor, type OpenDmnEditor } from "./dmnEditor";

const KogitoDmnEditorView = ({
  dmnModelToLoad,
  onDmnModelChange,
}: {
  dmnModelToLoad: Accessor<string | null | undefined>;
  onDmnModelChange: (dmnModelXml: string) => void;
}) => {
  let editorElement: HTMLDivElement | undefined;
  let editorObject: DmnEditorStandaloneApi | undefined;
  let contentChangeSubscription: ((isDirty: boolean) => void) | undefined;
  let isDisposed = false;

  /* SolidJS Lifecycle */
  onMount(() => {
    void import("@kie-tools/dmn-editor-standalone/dist").then(({ open }) => {
      if (!isDisposed) {
        initializeEditor(open);
      }
    });
  });
  onCleanup(() => {
    isDisposed = true;
    closeDmnEditor(editorObject, contentChangeSubscription);
  });

  const initializeEditor = (openEditor: OpenDmnEditor) => {
    if (!editorElement) {
      return;
    }

    const openedEditor = openDmnEditor({
      container: editorElement,
      dmnModel: dmnModelToLoad(),
      onDmnModelChange,
      openEditor,
    });
    editorObject = openedEditor.editor;
    contentChangeSubscription = openedEditor.contentChangeSubscription;
  };

  return (
    <div class="h-full overflow-auto">
      <div class="h-full" ref={(el: HTMLDivElement) => (editorElement = el)} />
    </div>
  );
};

export default KogitoDmnEditorView;
