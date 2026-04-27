import { For } from "solid-js";

const ErrorDisplayModal = ({
  title,
  closeModal,
  errors,
}: {
  title: string;
  closeModal: () => void;
  errors: string[];
}) => {
  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80">
        <h2 class="text-2xl font-bold mb-4">{title}</h2>
        <div class="mb-4 max-h-96 overflow-y-auto">
          <ul class="flex flex-col gap-2 font-mono">
            <For each={errors}>
              {(error, errorIndex) => (
                <>
                  <li class="bg-gray-200 p-3 flex flex-col font-mono">
                    {error}
                  </li>
                </>
              )}
            </For>
          </ul>
        </div>

        <div class="flex justify-end space-x-2">
          <button
            class="btn-default hover:bg-gray-200"
            onClick={() => {
              closeModal();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default ErrorDisplayModal;
