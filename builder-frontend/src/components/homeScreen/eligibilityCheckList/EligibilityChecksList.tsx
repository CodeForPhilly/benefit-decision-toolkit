import { createSignal, For, Setter, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

import Loading from "@/components/Loading";
import CheckModal from "./modals/CheckModal";
import eligibilityCheckResource from "./eligibilityCheckResource";

import type { EligibilityCheck } from "@/types";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import Tooltip from "@/components/shared/Tooltip";
import { Title } from "@solidjs/meta";

const EligibilityChecksList = () => {
  const { checks, actions, actionInProgress, initialLoadStatus } =
    eligibilityCheckResource();
  const navigate = useNavigate();

  const [addingNewCheck, setAddingNewCheck] = createSignal<boolean>(false);

  const [checkIdToRemove, setCheckIdToRemove] = createSignal<null | string>(
    null,
  );

  const navigateToCheck = (check: EligibilityCheck) => {
    navigate("/check/" + check.id);
  };

  return (
    <div>
      <Title>BDT - Custom Checks</Title>
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading />
      </Show>
      <div class="flex flex-row gap-2 items-baseline">
        <div class="text-xl font-bold mb-2">Eligibility Checks</div>
        <Tooltip>
          <p>
            If the public checks do not cover a requirement specific to your use
            case, BDT allows you to build your own reusable custom eligibility
            checks.
          </p>
          <p>
            <a href="https://bdt-docs.web.app/custom-checks/" target="_blank">
              Read about custom eligibility checks in the docs
            </a>
          </p>
        </Tooltip>
      </div>
      <div class="text-md mb-3">
        Manage your custom eligibility checks here. Click on a check to view or
        edit its details.
      </div>
      <div
        class="px-4 py-2 w-fit cursor-pointer bg-blue-500
                rounded-lg shadow-md hover:shadow-lg hover:bg-blue-600
                font-bold text-sm text-white"
        onClick={() => {
          setAddingNewCheck(true);
        }}
      >
        Create New Check
      </div>
      <div class="mt-4 grid gap-4 justify-items-center grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
      {checkIdToRemove() && (
        <ConfirmationModal
          confirmationTitle="Archive Check"
          confirmationText="Are you sure you want to archive this Eligibility Check? This action cannot be undone."
          callback={() => actions.removeCheck(checkIdToRemove()!)}
          closeModal={() => setCheckIdToRemove(null)}
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
            Archive
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityChecksList;
