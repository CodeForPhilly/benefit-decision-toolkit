import { createSignal, For, Setter, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

import Loading from "@/components/Loading";
import CheckModal from "./modals/CheckModal";
import eligibilityCheckResource from "./eligibilityCheckResource";

import type { EligibilityCheck } from "@/types";

const EligibilityChecksList = () => {
  const { checks, actions, actionInProgress, initialLoadStatus } =
    eligibilityCheckResource();
  const navigate = useNavigate();

  const [addingNewCheck, setAddingNewCheck] = createSignal<boolean>(false);

  const [checkIdToRemove, setCheckIdToRemove] = createSignal<null | string>(
    null
  );

  const navigateToCheck = (check: EligibilityCheck) => {
    navigate("/check/" + check.id);
  };

  return (
    <div class="px-12 py-8">
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading />
      </Show>
      <div class="text-3xl font-bold mb-2 tracking-wide">
        Eligibility Checks
      </div>
      <div class="text-lg mb-3">
        Manage your eligibility checks here. Click on a check to view or edit
        its details.
      </div>
      <div
        class="btn-default btn-blue mb-3 mr-1"
        onClick={() => {
          setAddingNewCheck(true);
        }}
      >
        Create New Check
      </div>
      <div class="grid gap-4 justify-items-center grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <For each={checks()}>
          {(check) => (
            <CheckCard
              eligibilityCheck={check}
              navigateToCheck={navigateToCheck}
              setCheckIdToRemove={setCheckIdToRemove}
            />
          )}
        </For>
      </div>
      {addingNewCheck() && (
        <CheckModal
          closeModal={() => setAddingNewCheck(false)}
          modalAction={actions.addNewCheck}
        />
      )}
    </div>
  );
};

const CheckCard = ({
  eligibilityCheck,
  navigateToCheck,
  setCheckIdToRemove,
}: {
  eligibilityCheck: EligibilityCheck;
  navigateToCheck: (check: EligibilityCheck) => void;
  setCheckIdToRemove: Setter<string>;
}) => {
  return (
    <div class="w-full flex">
      <div
        class="
          max-w-lg flex-1 flex flex-col
          border-1 border-gray-300 rounded-lg"
      >
        <div
          id={"check-card-details-" + eligibilityCheck.id}
          class="p-4 border-bottom border-gray-300 flex-1"
        >
          <div class="text-2xl mb-2 font-bold">{eligibilityCheck.name}</div>
          <div>
            <span class="font-bold">Description:</span>{" "}
            {eligibilityCheck.description}
          </div>
        </div>
        <div
          id={"benefit-card-actions-" + eligibilityCheck.id}
          class="p-4 flex justify-end space-x-2"
        >
          <div
            class="btn-default btn-gray"
            onClick={() => {
              navigateToCheck(eligibilityCheck);
            }}
          >
            Edit
          </div>
          <div
            class="btn-default btn-red"
            onClick={() => {
              setCheckIdToRemove(eligibilityCheck.id);
            }}
          >
            Remove
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityChecksList;
