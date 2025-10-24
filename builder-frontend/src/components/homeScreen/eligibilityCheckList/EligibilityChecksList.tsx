import { createSignal, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

import Loading from "@/components/Loading";
import AddNewCheckModal from "./modals/AddNewCheckModal";
import eligibilityCheckResource from "./eligibilityCheckResource";

import type { EligibilityCheck } from "@/types";


const EligibilityChecksList = () => {
  const { checks, actions, actionInProgress, initialLoadStatus } = eligibilityCheckResource();
  const navigate = useNavigate();

  const [addingNewCheck, setAddingNewCheck] = createSignal<boolean>(false);

  const navigateToCheck = (check: EligibilityCheck) => {
    navigate("/check/" + check.id);
  }

  return (
    <div class="p-4">
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading/>
      </Show>
      <div class="text-3xl font-bold mb-2 tracking-wide">
        Eligibility Checks
      </div>
      <div class="text-lg mb-3"> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </div>
      <div
        class="btn-default btn-blue mb-3 mr-1"
        onClick={() => {setAddingNewCheck(true)}}
      >
        Create New Check
      </div>
      <div class="flex flex-wrap gap-4">
        <For each={checks()}>
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
      {
        addingNewCheck() &&
        <AddNewCheckModal
          closeModal={() => setAddingNewCheck(false)}
          addNewCheck={actions.addNewCheck}
        />
      }
    </div>
  )
};

export default EligibilityChecksList;
