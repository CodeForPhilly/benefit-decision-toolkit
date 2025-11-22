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
  const { benefit, actions, actionInProgress, initialLoadStatus } = BenefitResource(
    screenerId,
    benefitId
  );

  const [checkListMode, setCheckListMode] =
    createSignal<EligibilityCheckListMode>("public");
  const [publicChecks] = createResource<EligibilityCheck[]>(fetchPublicChecks);
  const [userDefinedChecks] = createResource<EligibilityCheck[]>(
    () => fetchUserDefinedChecks(false)
  );

  const getSelectedCheck = (checkId: string) => {
    const allChecks = [
      ...(publicChecks() || []),
      ...(userDefinedChecks() || []),
    ];
    return allChecks.find((check) => check.id === checkId);
  };

  const onRemoveEligibilityCheck = (checkIndexToRemove: number) => {
    actions.removeCheck(checkIndexToRemove);
  };

  return (
    <>
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading />
      </Show>

      <Show when={benefit().id !== undefined && !initialLoadStatus.loading()}>
        <div class="p-5">
          <div class="flex mb-4">
            <div class="text-3xl font-bold tracking-wide">
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
          <div class="flex gap-4 flex-col 2xl:flex-row">
            <div
              id="eligibility-check-list"
              class="flex-3 border-2 border-gray-200 rounded-lg h-min"
            >
              <EligibilityCheckListView
                mode={checkListMode}
                setMode={setCheckListMode}
                publicChecks={publicChecks}
                userDefinedChecks={userDefinedChecks}
                addCheck={actions.addCheck}
              />
            </div>
            <div id="selected-eligibility-checks" class="flex-2">
              <div class="px-4 pb-4 text-2xl font-bold">
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
                          updateCheckConfigParams={
                            (newCheckData: ParameterValues) => {
                              actions.updateCheckConfigParams(checkIndex(), newCheckData);
                            }
                          }
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
