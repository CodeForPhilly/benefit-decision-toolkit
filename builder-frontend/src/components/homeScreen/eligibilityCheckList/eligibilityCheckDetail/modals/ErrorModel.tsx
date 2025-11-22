import { For } from "solid-js";

const ErrorDisplayModal = (
  { title, closeModal, errors }:
  { title: string; closeModal: () => void, errors: string[] }
) => {
  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80">
        <div class="text-2xl font-bold mb-4">{title}</div>
        <div class="mb-4 max-h-96 overflow-y-auto">
          <div class="flex flex-col gap-2 font-mono">
            <For each={errors}>
              {(error, errorIndex) => (
                <>
                  <div class="bg-gray-200 p-3 flex flex-col font-mono">
                    {error}
                  </div>
                </>
              )}
            </For>
          </div>
        </div>

        <div class="flex justify-end space-x-2">
          <div
            class="btn-default hover:bg-gray-200"
            onClick={() => { closeModal(); }}
          >
            Close
          </div>
        </div>
      </div>
    </div>
  );
}
export default ErrorDisplayModal;
