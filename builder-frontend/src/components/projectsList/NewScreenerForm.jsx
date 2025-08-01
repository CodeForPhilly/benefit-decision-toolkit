import { createSignal, onCleanup } from "solid-js";

export default function NewScreenerForm({
  setIsModalVisible,
  handleCreateNewScreener,
}) {
  const [isLoading, setIsLoading] = createSignal(false);
  let nameInput;
  let isActive = true;

  onCleanup(() => {
    isActive = false;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const data = {
      screenerName: nameInput.value,
    };
    await handleCreateNewScreener(data);
    if (isActive) setIsLoading(false);
  };

  return (
    <div
      onClick={() => setIsModalVisible(false)}
      className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 h-96"
      >
        <div className="flex justify-between">
          <div className="text-2xl">Create a screener</div>
          <div
            onClick={() => setIsModalVisible(false)}
            className="text-2xl hover:font-bold hover:cursor-pointer"
          >
            X
          </div>
        </div>
        <div className="mt-12 text-3xl font-bold w-80">
          What is the name of your screener?
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mt-8 flex flex-col">
            <label>Screener Name:</label>
            <input
              type="text"
              ref={(el) => (nameInput = el)}
              className="p-1 border-1 border-gray-400 w-90"
            ></input>
          </div>
          <button
            type="submit"
            disabled={isLoading()}
            className="mt-3 py-2 px-4 text-white rounded bg-gray-800 disabled:opacity-50"
          >
            Create
          </button>
          {isLoading() && <div>Loading ...</div>}
        </form>
      </div>
    </div>
  );
}
