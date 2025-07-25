import { Show } from "solid-js";

export default function ModelDetail({
  model,
  isImported,
  onImport,
  onRemove,
  deselect,
}) {
  return (
    <div class="p-6 h-full flex flex-col">
      <div className="flex w-full">
        <div
          onClick={deselect}
          className="text-xl ml-auto hover:cursor-pointer hover:font-bold"
        >
          X
        </div>
      </div>
      <div class="mb-2">
        <h2 class="text-2xl font-bold text-gray-800 mb-1">{model.name}</h2>
        <p class="text-gray-600 text-sm">Publisher: {model.groupId}</p>
        <p class="text-gray-500 mt-2">{model.description}</p>
      </div>
      <div>
        {isImported ? (
          <div
            onClick={() => onRemove(model)}
            className="px-2 rounded border-2 border-gray-500 text-gray-500 w-fit hover:bg-gray-100"
          >
            Remove Model
          </div>
        ) : (
          <div
            onClick={() => onImport(model)}
            className="px-2 rounded border-2 border-emerald-500 text-emerald-500 w-fit hover:bg-emerald-100"
          >
            Import Model
          </div>
        )}
      </div>
    </div>
  );
}
