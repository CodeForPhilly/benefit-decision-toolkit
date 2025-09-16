import { createSignal, onCleanup, onMount, Accessor, Setter } from "solid-js";
import { useParams } from "@solidjs/router";

import * as DmnEditor from "@kie-tools/dmn-editor-standalone/dist"

import { saveDmnModel } from "../../api/screener";


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


/* TODO: Move to Project.jsx if file uses types */
type ProjectDependency = {
  groupId: string;
  artifactId: string;
  version: string;
  xml: string
};

type DmnResourceMap = Map<string, DmnEditor.DmnEditorStandaloneResource>;

export default function KogitoDmnEditorView({
  dmnModel,
  setDmnModel,
  projectDependencies,
}: {
  dmnModel: Accessor<string>;
  setDmnModel: Setter<string>;
  projectDependencies: Accessor<ProjectDependency[]>;
}) {
  const [isUnsaved, setIsUnsaved] = createSignal<boolean>(false);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  const params = useParams<{ projectId: string }>();

  let editorElement: null | Element = null;
  let editorObject: null | DmnEditor.DmnEditorStandaloneApi = null;
  let saveTimeoutId: null | number = null;

  /* SolidJS Lifecycle */
  onMount(async () => {
    initializeEditor();
  });
  onCleanup(() => {
    if (editorObject) editorObject.close();
    if (saveTimeoutId) clearTimeout(saveTimeoutId);
  });

  const buildDmnResources = (): DmnResourceMap => {
    return new Map(
      projectDependencies().map((dep) => [
        `${dep.groupId}:${dep.artifactId}:${dep.version}.dmn`,
        {
          contentType: "text",
          content: Promise.resolve(trimXml(dep.xml)),
        },
      ])
    );
  }

  const initializeEditor = async () => {
    const modelXml: string = dmnModel();
    const initialDmnPromise: string = (modelXml) ? trimXml(modelXml): "";
    const dmnResourceMap: DmnResourceMap = buildDmnResources();

    editorObject = DmnEditor.open({
      container: editorElement,
      initialFileNormalizedPosixPathRelativeToTheWorkspaceRoot: "screener.dmn",
      initialContent: Promise.resolve(initialDmnPromise),
      resources: dmnResourceMap,
      readOnly: false,
    });
    editorObject.subscribeToContentChanges(
      async (isDirty: boolean) => { setIsUnsaved(isDirty); }
    );
  };

  const handleSave = async () => {
    const currentEditorXml: string = await editorObject.getContent();
    setIsUnsaved(false);
    setIsSaving(true);

    saveDmnModel(params.projectId, currentEditorXml);

    setDmnModel(currentEditorXml);
    setIsSaving(false);
    clearTimeout(saveTimeoutId);
    saveTimeoutId = setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <>
      <div class="h-full overflow-auto">
        <div
          class="h-full"
          ref={ (el: HTMLDivElement) => (editorElement = el) }
        />
      </div>
      <div class="fixed z-50 top-16 right-4 flex ml-auto mr-8 gap-2 justify-center">
        {isUnsaved() && (
          <span class="underline text-sm flex items-center text-gray-500">
            unsaved changes
          </span>
        )}
        {isSaving() && (
          <span class="text-sm flex items-center text-gray-500">
            saving ...
          </span>
        )}
        <button
          onClick={handleSave}
          class="px-2 text-emerald-500 h-8 border-2 rounded hover:bg-emerald-100"
        >
          Save
        </button>
      </div>
    </>
  );
}
