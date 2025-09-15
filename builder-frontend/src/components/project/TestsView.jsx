import { createSignal, Show, For } from "solid-js";
import { helloAPI } from "../../api/screener";

function TestsView() {
  const [expanded, setExpanded] = createSignal({});

  const tests = [
    {
      id: 0,
      name: "Lives In Philly, $200k income",
      contents: [
        {
          key: "key1Name",
          value: "value1Name",
        },
        {
          key: "key2Name",
          value: "value2Name",
        },
      ],
    },
    {
      id: 1,
      name: "Lives In Allentown, $200k income",
      contents: [
        {
          key: "key1Name",
          value: "value1Name",
        },
        {
          key: "key2Name",
          value: "value2Name",
        },
      ],
    },
    {
      id: 2,
      name: "Lives In NYC, $15k income",
      contents: [
        {
          key: "key1Name",
          value: "value1Name",
        },
        {
          key: "key2Name",
          value: "value2Name",
        },
      ],
    },
  ];

  const handleToggle = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRun = async () => {
    const data = await helloAPI();
    console.log(data);
  };

  return (
    <div className="p-3">
      <div className="flex justify-between mb-3">
        <h1>All Tests</h1>
        <button
          className="border-1 rounded-lg border-green-500 bg-green-100 font-medium text-green-900 px-3 py-1"
          onClick={() => handleRun()}
        >
          Run All
        </button>
      </div>
      <For each={tests}>
        {(test) => (
          <div className="border-1 rounded-lg px-4 p-2 mb-4">
            <div className=" flex justify-between items-center">
              <span>{test.name}</span>
              <div className="flex gap-2">
                <button className="border-1 rounded-lg border-green-500 bg-green-100 font-medium text-green-900 px-3 py-1">
                  Run
                </button>
                <button
                  className="border-1 border-gray-500 bg-gray-100 font-medium text-gray-900 px-3 py-1"
                  onClick={() => handleToggle(test.id)}
                >
                  <Show when={!expanded()[test.id]} fallback="Hide">
                    Show
                  </Show>
                </button>
              </div>
            </div>
            <Show when={expanded()[test.id]}>
              <div className="py-2">
                <div className="flex gap-2 justify-end">
                  <button className="border-1 rounded-lg border-gray-500 bg-gray-100 font-medium text-gray-900 px-3 py-1">
                    Rename
                  </button>
                  <button className="border-1 border-red-500 bg-red-100 font-medium text-red-900 px-3 py-1">
                    Delete
                  </button>
                </div>
                <For each={test.contents}>
                  {(contents) => (
                    <p>
                      {contents.key}: {contents.value}
                    </p>
                  )}
                </For>
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}

export default TestsView;
