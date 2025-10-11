import { Accessor, createResource, createSignal, For, Show } from "solid-js";

import SelectedEligibilityCheck from "./SelectedEligibilityCheck";
import EligibilityCheckListView from "./EligibilityCheckListView";

import { fetchPublicChecks, fetchUserDefinedChecks } from "../../../../api/check";

import type { EligibilityCheckListMode } from "./EligibilityCheckListView";
import type { EligibilityCheck } from "../types";

import BenefitResource from "./benefitResource";
import Loading from "../../../Loading";


const ConfigureBenefit = (
  { screenerId, benefitId, setBenefitId }:
  { screenerId: Accessor<string>; benefitId: Accessor<string>; setBenefitId: (benefitId: string | null) => void }
) => {
  const { benefit, actions, initialLoadStatus } = BenefitResource(screenerId, benefitId);

  const [checkListMode, setCheckListMode] = createSignal<EligibilityCheckListMode>("public");
  const [publicChecks] = createResource<EligibilityCheck[]>(fetchPublicChecks);
  const [userDefinedChecks] = createResource<EligibilityCheck[]>(fetchUserDefinedChecks);

  const getSelectedCheck = (checkId: string) => {
    const allChecks = [...publicChecks() || [], ...userDefinedChecks() || []];
    return allChecks.find((check) => check.id === checkId);
  }

  return (
    <>
      <Show when={initialLoadStatus.loading()}>
        <Loading/>
      </Show>

      <Show when={benefit().id !== undefined && !initialLoadStatus.loading()}>
        <div class="p-5">
          <div class="flex mb-4">
            <div class="text-3xl font-bold tracking-wide">
              Configure Benefit: {benefit() ? benefit().name : "No Benefit Found"}
            </div>
            <div class="ml-auto">
              <div
                class="btn-default btn-gray"
                onClick={() => {setBenefitId(null)}}
              >
                Back
              </div>
            </div>
          </div>
          <div class="flex gap-4 flex-col 2xl:flex-row">
            <div id="eligibility-check-list" class="flex-3 border-2 border-gray-200 rounded-lg h-min">
              <EligibilityCheckListView
                benefit={benefit}
                mode={checkListMode}
                setMode={setCheckListMode}
                publicChecks={publicChecks}
                userDefinedChecks={userDefinedChecks}
                addCheck={actions.addCheck}
                removeCheck={actions.removeCheck}
              />
            </div>
            <div id="selected-eligibility-checks" class="flex-2">
              <div class="px-4 pb-4 text-2xl font-bold">
                Selected eligibility checks for {benefit().name}
              </div>

              <div class="px-4">
                {benefit() && benefit().checks.length === 0 && (
                  <div class="text-gray-500">
                    No eligibility checks selected. Use the checkboxes to add checks to this benefit.
                  </div>
                )}
                {benefit().checks.length > 0 && (
                  <For each={benefit().checks}>
                    {(checkConfig, checkIndex) => {
                      return (
                        <Show when={getSelectedCheck(checkConfig.checkId)}>
                          <SelectedEligibilityCheck
                            check={getSelectedCheck(checkConfig.checkId)}
                            checkConfig={() => checkConfig}
                            checkIndex={checkIndex()}
                            updateCheckConfigParams={actions.updateCheckConfigParams}
                          />
                        </Show>
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
}
export default ConfigureBenefit;
