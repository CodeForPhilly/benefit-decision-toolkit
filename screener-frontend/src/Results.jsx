import { For } from "solid-js";
import EligibilityResults from "./EligibilityResults";

export default function Results({ results }) {
  return (
    <div class="my-4 mx-8 p-4 border border-gray-300 rounded shadow-sm">
      <EligibilityResults />
    </div>
  );
}
