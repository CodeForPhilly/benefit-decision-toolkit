import { createSignal, JSX } from "solid-js";
import TrashIcon from "../icon/TrashIcon";
import DeleteConfirmation from "./DeleteConfirmation";
import { Modal } from "@/components/shared/Modal";

export interface EditModalData {
  screenerId: string;
  screenerName: string;
}

interface Props {
  modalData: EditModalData;
  handleEditScreener: (
    screenerId: string,
    data: { screenerName: string },
  ) => Promise<void>;
  handleDeleteScreener: (data: { id: string }) => Promise<void>;
}

export default function EditScreenerForm(props: Props) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = createSignal(false);
  const [screenerName, setScreenerName] = createSignal(
    props.modalData.screenerName,
  );

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const data = { screenerName: screenerName() };
      await props.handleEditScreener(props.modalData.screenerId, data);
      setIsLoading(false);
    } catch (e) {
      if (isLoading()) {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const data = { id: props.modalData.screenerId };
      await props.handleDeleteScreener(data);
      setIsLoading(false);
    } catch (e) {
      if (isLoading()) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div class="text-xl font-bold">Edit screener</div>

        <div>
          <div class="mt-8 flex flex-col">
            <label>Screener Name:</label>
            <input
              type="text"
              value={screenerName()}
              onInput={(e) => setScreenerName(e.currentTarget.value)}
              class="p-1 border-1 border-gray-400 w-90"
            ></input>
          </div>
          <button
            type="submit"
            disabled={isLoading()}
            class="mt-3 py-2 px-4 text-white rounded bg-gray-800 disabled:opacity-50"
          >
            Update
          </button>
        </div>
      </form>

      <div class="pt-8">
        <hr class="w-100 border-t border-gray-300" />
      </div>

      <button
        type="button"
        onClick={() => setIsConfirmationVisible(true)}
        class="text-red-400 flex border-2 border-red-400 rounded px-3 py-1"
      >
        <TrashIcon /> Delete Screener
      </button>
      <Modal
        show={isConfirmationVisible()}
        onClose={() => setIsConfirmationVisible(false)}
      >
        <DeleteConfirmation
          screenerName={props.modalData.screenerName}
          onCancel={() => setIsConfirmationVisible(false)}
          onDelete={handleDelete}
        />
      </Modal>
    </div>
  );
}
