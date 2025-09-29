import { createResource, useContext, For, createSignal } from "solid-js";

import SelectedEligibilityCheck from "./SelectedEligibilityCheck";
import EligibilityCheckListView from "./EligibilityCheckListView";

import { BenefitConfigurationContext, CheckConfigurationContext } from "../contexts";
import { getPublicChecks, getUserDefinedChecks } from "../../../../api/fake_check_endpoints";

import type { EligibilityCheckListMode } from "./EligibilityCheckListView";
import type { EligibilityCheck } from "../types";


const ConfigureBenefit = () => {
  const [checkListMode, setCheckListMode] = createSignal<EligibilityCheckListMode>("user-defined");
  const [publicChecks] = createResource<EligibilityCheck[]>(getPublicChecks);
  const [userDefinedChecks] = createResource<EligibilityCheck[]>(getUserDefinedChecks);
  const {benefit, setBenefitIndex} = useContext(BenefitConfigurationContext);

  return (
    <div class="p-5">
      <div class="flex mb-4">
        <div class="text-3xl font-bold tracking-wide">
          Configure Benefit: {benefit() ? benefit().name : "No Benefit Found"}
        </div>
        <div class="ml-auto">
          <div
            class="btn-default btn-gray"
            onClick={() => {setBenefitIndex(null)}}
          >
            Back
          </div>
        </div>
      </div>
      <div class="flex gap-4 flex-col 2xl:flex-row">
        <div id="eligibility-check-list" class="flex-3 border-2 border-gray-200 rounded-lg h-min">
          <EligibilityCheckListView
            mode={checkListMode}
            setMode={setCheckListMode}
            publicChecks={publicChecks}
            userDefinedChecks={userDefinedChecks}
          />
        </div>
        <div id="selected-eligibility-checks" class="flex-2">
          <div class="px-4 pb-4 text-2xl font-bold">
            Selected eligibility checks for {benefit().name}
          </div>

          <div class="px-4">
            {benefit().checks.length === 0 && (
              <div class="text-gray-500">
                No eligibility checks selected. Use the checkboxes to add checks to this benefit.
              </div>
            )}
            {benefit().checks.length > 0 && (
              <For each={benefit().checks}>
                {(check, checkIndex) => (
                  <CheckConfigurationContext.Provider value={{check, checkIndex}}>
                    <SelectedEligibilityCheck/>
                  </CheckConfigurationContext.Provider>
                )}
              </For>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ConfigureBenefit;
