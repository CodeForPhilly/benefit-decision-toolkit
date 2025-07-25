import * as DmnEditor from "@kogito-tooling/kie-editors-standalone/dist/dmn";
import { createSignal, onCleanup, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import { saveDmnModel } from "../../api/screener";

export default function KogitoDmnEditorView({
  dmnModel,
  setDmnModel,
  projectDependencies,
}) {
  const [isUnsaved, setIsUnsaved] = createSignal("Not Dirty");
  const [isSaving, setIsSaving] = createSignal(false);
  const params = useParams();
  let container;
  let editor;
  let timeoutId;

  const trimDmn = (xml) => {
    let dmn = "";
    const firstChar = xml.charAt(0);
    const lastChar = xml.charAt(xml.length - 1);
    if (firstChar == '"' && lastChar == '"') dmn = xml.slice(1, -1);
    else dmn = xml;
    return dmn;
  };

  function buildDmnResources() {
    console.log(projectDependencies());
    return new Map(
      projectDependencies().map((dep) => [
        `${dep.groupId}:${dep.artifactId}:${dep.version}.dmn`,
        {
          contentType: "text",
          content: Promise.resolve(trimDmn(dep.xml)),
        },
      ])
    );
  }

  async function loadDependencies() {
    const dependencies = new Map([
      "utility.dmn",
      {
        contentType: "text",
        content: Promise.resolve(projectDependencies()[0].xml),
      },
    ]);

    return dependencies;
  }

  async function loadScreenerModel() {
    let initialDmn = "";
    let xml = dmnModel();
    if (!xml) return initialDmn;
    else {
      const firstChar = xml.charAt(0);
      const lastChar = xml.charAt(xml.length - 1);
      if (firstChar == '"' && lastChar == '"') initialDmn = xml.slice(1, -1);
      else initialDmn = xml;
    }

    return initialDmn;
  }

  const initializeEditor = async () => {
    const initialDmn = loadScreenerModel();

    editor = DmnEditor.open({
      container: container,
      initialFileNormalizedPosixPathRelativeToTheWorkspaceRoot: "screener.dmn",
      initialContent: Promise.resolve(initialDmn),
      resources: buildDmnResources(),
      readOnly: false,
    });

    editor.subscribeToContentChanges(async (isDirty) => {
      if (isDirty) {
        setIsUnsaved("Dirty");
      } else {
        setIsUnsaved("Not Dirty");
      }
    });
  };

  onMount(async () => {
    initializeEditor();
  });

  onCleanup(() => {
    if (editor) editor.close();
  });

  const handleSave = async () => {
    const xml = await editor.getContent();
    setIsUnsaved(false);
    setIsSaving(true);
    saveDmnModel(params.projectId, xml);
    setDmnModel(xml);
    setIsSaving(false);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <>
      <div className="h-full overflow-auto">
        <div className="h-full" ref={(el) => (container = el)} />
      </div>
      <div className="fixed z-50 top-16 right-4 flex ml-auto mr-8 gap-2 justify-center">
        {isUnsaved() && (
          <span className="underline text-sm flex items-center text-gray-500">
            unsaved changes
          </span>
        )}
        {isSaving() && (
          <span className="text-sm flex items-center text-gray-500">
            saving ...
          </span>
        )}
        <button
          onClick={handleSave}
          className="px-2 text-emerald-500 h-8 border-2 rounded hover:bg-emerald-100"
        >
          Save
        </button>
      </div>
    </>
  );
}
