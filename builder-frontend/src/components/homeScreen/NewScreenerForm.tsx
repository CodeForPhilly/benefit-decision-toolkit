import { createNewScreener } from "@/api/screener";
import { useNavigate } from "@solidjs/router";
import { createSignal, onCleanup } from "solid-js";

export default function NewScreenerForm({}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = createSignal(false);
  let nameInput;
  let isActive = true;

  onCleanup(() => {
    isActive = false;
  });

  const handleCreateNewScreener = async (screenerData: {
    screenerName: string;
    description: string;
  }) => {
    try {
      const newScreener = await createNewScreener(screenerData);
      navigate(`/projects/${newScreener.id}`);
    } catch (e) {
      console.log("Error creating screener", e);
    }
  };

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
    <div>
      <div className="text-2xl">Create a screener</div>
      <div class="mt-12 text-3xl font-bold">
        What is the name of your screener?
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mt-8 flex flex-col">
          <label>Screener Name:</label>
          <input
            type="text"
            id="new-screener-name"
            ref={(el) => (nameInput = el)}
            class="form-input-custom"
          />
        </div>
        <button
          type="submit"
          id="new-screener-submit"
          disabled={isLoading()}
          class="mt-3 py-2 px-4 text-white rounded bg-gray-800 disabled:opacity-50"
        >
          Create
        </button>
      </form>
    </div>
  );
}
