import { createResource, createSignal, createMemo } from "solid-js";
import { fetchAvailableModels } from "../../api/models";
import ModelDetail from "./ModelDetail";
import { addDependency } from "../../api/screener";

export default function ImportModels({
  screener,
  dependencies,
  fetchAndCacheProject,
}) {
  const [availableModels, { refetchAvailableModels }] =
    createResource(fetchAvailableModels);
  const [selectedModel, setSelectedModel] = createSignal();
  const [showInstalled, setShowInstalled] = createSignal(false);

  const installedModels = createMemo(() => {
    if (!dependencies) return [];
    const depKeys = new Set(
      dependencies.map(
        (dep) => `${dep.groupId}:${dep.artifactId}:${dep.version}`
      )
    );
    console.log({ depKeys });
    if (!availableModels()) return [];
    return availableModels().filter((model) =>
      depKeys.has(`${model.groupId}:${model.artifactId}:${model.version}`)
    );
  });

  const handleImportModel = async (model) => {
    await addDependency(screener().id, model);
    await fetchAndCacheProject(screener().id);
  };

  const models = createMemo(() => {
    return showInstalled() ? installedModels() : availableModels();
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Pane: Scrollable list */}
      <div className="w-1/3 h-full overflow-y-auto border-r border-gray-300">
        {/* Available Models Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-100">
          <span className="font-semibold text-gray-700">Available Models</span>
          <div class="flex items-center space-x-4">
            <span class="text-sm font-medium text-gray-700">All</span>

            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                class="sr-only peer"
                checked={showInstalled()}
                onInput={(e) => setShowInstalled(e.currentTarget.checked)}
              />
              <div class="w-11 h-6 bg-gray-300 peer-checked:bg-emerald-600 rounded-full transition-colors"></div>
              <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
            </label>

            <span class="text-sm font-medium text-gray-700">Installed</span>
          </div>
        </div>
        {models() &&
          models().map((model, index) => (
            <div
              onClick={() => setSelectedModel(model)}
              key={index}
              className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
            >
              <div className="text-gray-900 font-bold">{model.name}</div>
              <div className="text-gray-700 text-sm">
                {model.shortDescription}
              </div>
              <div className="text-gray-500 text-xs">{model.groupId}</div>
            </div>
          ))}
      </div>
      {/* Model Details window */}
      <div className="flex-1 h-full p-6 overflow-y-auto">
        {!!selectedModel() ? (
          <ModelDetail
            model={selectedModel()}
            isImported={false}
            onImport={handleImportModel}
            onRemove={() => console.log("On remove")}
            deselect={() => setSelectedModel()}
          ></ModelDetail>
        ) : (
          <>
            <div className="text-2xl text-gray-800 font-bold">
              Include external models in your screener project.
            </div>
            <div className="pt-4 text-gray-700">
              Import pre-built models to use in your project. When you import an
              external DMN model, it's elements are avilable to use in the DMN
              editor. DMN decisions and other elements from an imported model
              cannot be modified.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
