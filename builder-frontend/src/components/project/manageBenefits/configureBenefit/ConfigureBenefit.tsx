import { Accessor, createResource, createSignal, For, Show } from "solid-js";

import SelectedEligibilityCheck from "./SelectedEligibilityCheck";
import EligibilityCheckListView from "./EligibilityCheckListView";
import Loading from "../../../Loading";

import BenefitResource from "./benefitResource";
import { fetchPublicChecks, fetchUserDefinedChecks } from "@/api/check";

import type { EligibilityCheckListMode } from "./EligibilityCheckListView";
import type { EligibilityCheck, ParameterValues } from "@/types";

const ConfigureBenefit = ({
  screenerId,
  benefitId,
  setBenefitId,
}: {
  screenerId: Accessor<string>;
  benefitId: Accessor<string>;
  setBenefitId: (benefitId: string | null) => void;
}) => {
  const { benefit, actions, actionInProgress, initialLoadStatus } =
    BenefitResource(screenerId, benefitId);

  const [checkListMode, setCheckListMode] =
    createSignal<EligibilityCheckListMode>("public");
  const [publicChecks] = createResource<EligibilityCheck[]>(fetchPublicChecks);
  const [userDefinedChecks] = createResource<EligibilityCheck[]>(() =>
    fetchUserDefinedChecks(false),
  );
  const [selectedCheck, setSelectedCheck] = createSignal<EligibilityCheck>();

  const onRemoveEligibilityCheck = (checkIndexToRemove: number) => {
    actions.removeCheck(checkIndexToRemove);
  };

  return (
    <>
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading />
      </Show>

      <Show when={benefit().id !== undefined && !initialLoadStatus.loading()}>
        <div class="h-full flex flex-col">
          <div class="flex py-3 pl-5 border-gray-200 border-b-2">
            <div class="text-xl font-bold tracking-wide">
              Configure Benefit:{" "}
              {benefit() ? benefit().name : "No Benefit Found"}
            </div>
            <div class="ml-auto">
              <div
                class="btn-default btn-gray"
                onClick={() => {
                  setBenefitId(null);
                }}
              >
                Back
              </div>
            </div>
          </div>
          <div class="flex flex-row flex-1 min-h-0">
            <div
              id="eligibility-check-list"
              class="w-sm border-r-2 border-gray-200"
            >
              <EligibilityCheckListView
                mode={checkListMode}
                setMode={setCheckListMode}
                publicChecks={publicChecks}
                userDefinedChecks={userDefinedChecks}
                addCheck={actions.addCheck}
              />
            </div>
            <div id="configure-eligibility-check" class="flex-grow bg-stone-50">
              {
                // When no check is selected
                <>
                  <Show when={!selectedCheck()}>
                    <div>No check selected</div>
                  </Show>
                  <Show when={selectedCheck()}>
                    <div>Check selected</div>
                  </Show>
                </>
              }
            </div>
            <div id="selected-eligibility-checks" class="w-sm overflow-y-auto">
              <div class="p-4 text-xl font-bold">
                Selected eligibility checks for {benefit().name}
              </div>

              <div class="px-4">
                {benefit() && benefit().checks.length === 0 && (
                  <div class="text-gray-500">
                    No eligibility checks selected. Use the checkboxes to add
                    checks to this benefit.
                  </div>
                )}
                {benefit().checks.length > 0 && (
                  <For each={benefit().checks}>
                    {(checkConfig, checkIndex) => {
                      return (
                        <SelectedEligibilityCheck
                          checkId={() => checkConfig.checkId}
                          checkConfig={() => checkConfig}
                          onRemove={() =>
                            onRemoveEligibilityCheck(checkIndex())
                          }
                          updateCheckConfigParams={(
                            newCheckData: ParameterValues,
                          ) => {
                            actions.updateCheckConfigParams(
                              checkIndex(),
                              newCheckData,
                            );
                          }}
                        />
                      );
                    }}
                  </For>
                )}
              </div>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};
export default ConfigureBenefit;
