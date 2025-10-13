import { createSignal, onCleanup, onMount } from "solid-js";
import TrashIcon from "../icon/TrashIcon";
import DeleteConfirmation from "./DeleteConfirmation";

export default function EditScreenerForm({
  setIsEditModalVisible,
  screenerData,
  handleEditScreener,
  handleDeleteScreener,
}) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = createSignal(false);
  const [screenerName, setScreenerName] = createSignal();
  let isActive = true;

  onMount(() => {
    if (screenerData?.screenerName) {
      setScreenerName(screenerData.screenerName);
    }
  });

  onCleanup(() => {
    isActive = false;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const data = {
        screenerName: screenerName(),
        id: screenerData.id,
      };
      await handleEditScreener(data);
      if (isActive) setIsLoading(false);
    } catch (e) {
      if (setIsLoading()) {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const data = {
        id: screenerData.id,
      };
      await handleDeleteScreener(data);
      if (isActive) setIsLoading(false);
    } catch (e) {
      if (setIsLoading()) {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteClicked = (e) => {
    e.preventDefault();
    setIsConfirmationVisible(true);
  };

  return (
    <>
      <div
        onClick={() => setIsEditModalVisible(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <form
          onClick={(e) => e.stopPropagation()}
          className="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 h-96"
        >
          <div className="flex justify-between">
            <div className="text-xl font-bold">Edit screener</div>
            <div
              onClick={() => setIsEditModalVisible(false)}
              className="text-2xl hover:font-bold hover:cursor-pointer"
            >
              X
            </div>
          </div>

          <div>
            <div className="mt-8 flex flex-col">
              <label>Screener Name:</label>
              <input
                type="text"
                value={screenerName()}
                onInput={(e) => setScreenerName(e.currentTarget.value)}
                className="p-1 border-1 border-gray-400 w-90"
              ></input>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading()}
              className="mt-3 py-2 px-4 text-white rounded bg-gray-800 disabled:opacity-50"
            >
              Update
            </button>

            <div className="pt-8">
              <hr class="w-100 border-t border-gray-300" />
            </div>

            <button
              onClick={handleDeleteClicked}
              className="text-red-400 flex border-2 border-red-400 rounded px-3 py-1"
            >
              <TrashIcon></TrashIcon>Delete Screener
            </button>

            {isLoading() && <div>Loading ...</div>}
          </div>
        </form>
      </div>
      {isConfirmationVisible() && (
        <DeleteConfirmation
          screenerData={screenerData}
          setIsConfirmationVisible={setIsConfirmationVisible}
          handleDelete={handleDelete}
        ></DeleteConfirmation>
      )}
    </>
  );
}
