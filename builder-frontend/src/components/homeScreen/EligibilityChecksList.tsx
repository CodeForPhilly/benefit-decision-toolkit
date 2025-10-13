import { createResource, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { fetchPublicChecks } from "../../api/check";
import { EligibilityCheck } from "../project/manageBenefits/types";


const EligibilityChecksList = () => {
  const [checkList] = createResource(fetchPublicChecks);
  const navigate = useNavigate();

  const navigateToCheck = (check: EligibilityCheck) => {
    navigate("/check/" + check.id);
  }

  return (
    <div class="p-4">
      <Show when={checkList()} fallback={<div>Loading...</div>}>
        <div class="flex flex-wrap gap-4">
          <For each={checkList()}>
            {(check) => (
              <div
                class="border-2 border-gray-200 rounded p-4 w-60 hover:shadow-lg hover:bg-gray-200 cursor-pointer"
                onClick={() => navigateToCheck(check)}
              >
                <div class="text-lg font-bold text-gray-800">{check.name}</div>
                <div class="mt-2 text-gray-700">{check.description || "No description provided."}</div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
};

export default EligibilityChecksList;
