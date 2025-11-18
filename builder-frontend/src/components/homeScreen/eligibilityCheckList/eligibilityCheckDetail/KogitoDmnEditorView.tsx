import { onCleanup, onMount, Accessor, Setter, createEffect } from "solid-js";

import * as DmnEditor from "@kogito-tooling/kie-editors-standalone/dist/dmn";


/* Utility function to trim starting and ending quotes from XML string */
const trimXml = (xml: string): string => {
  const firstChar: string = xml.charAt(0);
  const lastChar: string = xml.charAt(xml.length - 1);

  if (firstChar === '"' && lastChar === '"') {
    // Return without starting and ending quotes
    return xml.slice(1, -1);
  }
  return xml;
};

export default function KogitoDmnEditorView({
  dmnModel, setTmpDmnModel,
}: {
  dmnModel: Accessor<string>;
  setTmpDmnModel: Setter<string>;
}) {
  let editorElement: null | Element = null;
  let editorObject: null | any = null;
  let saveTimeoutId: null | number = null;

  /* SolidJS Lifecycle */
  onMount(async () => {
    initializeEditor();
  });
  onCleanup(() => {
    if (editorObject) editorObject.close();
    if (saveTimeoutId) clearTimeout(saveTimeoutId);
  });

  const initializeEditor = async () => {
    const modelXml: string = dmnModel();
    const initialDmnPromise: string = (modelXml) ? trimXml(modelXml): "";

    editorObject = DmnEditor.open({
      container: editorElement,
      initialContent: Promise.resolve(initialDmnPromise),
      resources: new Map(),
      readOnly: false,
    });
    editorObject.subscribeToContentChanges(
      async (_: boolean) => {
        const xml = await editorObject.getContent();
        setTmpDmnModel(xml);
      }
    );
  };

  return (
    <div class="h-full overflow-auto">
      <div
        class="h-full"
        ref={ (el: HTMLDivElement) => (editorElement = el) }
      />
    </div>
  );
}