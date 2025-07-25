import { For } from "solid-js";

export default function Results({ results }) {
  return (
    <div class="my-4 mx-8 p-4 border border-gray-300 rounded shadow-sm">
      <h2 class="text-gray-800 text-md font-bold">Results</h2>
      <div class="my-2">
        {results() && results().inputs && (
          <>
            <h2 class="text-gray-600 text-sm font-bold">Inputs</h2>
            <ul>
              {Object.entries(results().inputs).map(([key, value]) => (
                <li className="text-sm py-2" key={key}>
                  <span>{key}:</span> {value}
                </li>
              ))}
            </ul>
          </>
        )}
        {results() && results().decisions && (
          <div className="pt-4">
            <h2 class="text-gray-600 text-sm font-bold">Results</h2>
            <ul>
              {results().decisions.map((decision) => {
                return (
                  <li className="py-2 text-sm">
                    <span>{decision.decisionName + ": "}</span>
                    <span></span> {decision.result}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
