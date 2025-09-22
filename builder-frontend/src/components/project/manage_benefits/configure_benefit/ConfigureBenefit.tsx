import { createEffect, Accessor, Setter, useContext } from "solid-js";
import { SetStoreFunction } from "solid-js/store"

import { ProjectBenefits as ProjectBenefitsType, Benefit } from "../types";
import { createResource } from "solid-js";
import { getAllAvailableChecks } from "./fake_check_endpoints";
import type { EligibilityCheck } from "../types";
import SelectedEligibilityCheck from "./SelectedEligibilityCheck";

import { BenefitConfigurationContext, CheckConfigurationContext } from "../contexts";

// Shamelessly stolen from:
// https://stackoverflow.com/questions/64489395/converting-snake-case-string-to-title-case
// Changed to be sentence case rather than title case
const titleCase = (str: string) => {
  return str.replace(
    /^_*(.)|_+(.)/g,
    (s, c, d) => c ? c.toUpperCase() : ' ' + d
  );
}


const ConfigureBenefit = () => {
  const {benefit, benefitIndex, setBenefitIndex, setProjectBenefits} = useContext(BenefitConfigurationContext);

  const [availableChecks] = createResource<EligibilityCheck[]>(getAllAvailableChecks);

  createEffect(() => {
    // For dev purposes, auto-add the first available check if none are selected
    // TODO: remove this when we have a more robust UI
    // if (benefitToConfigure().checks.length === 0) {
    //   onSubcheckToggle(availableChecks()[0]);
    // }
  });

  const onSubcheckToggle = (check: EligibilityCheck) => {
    const updatedBenefit: Benefit = { ...benefit() };
    const isCheckSelected = updatedBenefit.checks.some((selected) => selected.id === check.id);
    if (isCheckSelected) {
      updatedBenefit.checks = updatedBenefit.checks.filter((selected) => selected.id !== check.id);
    } else {
      updatedBenefit.checks = [...updatedBenefit.checks, structuredClone(check)];
    }
    setProjectBenefits("benefits", benefitIndex(), updatedBenefit);
  };

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
      <div
        class="
          flex gap-4
          flex-col 2xl:flex-row"
      >
        <div class="flex-2 border-2 border-gray-200 rounded-lg">
          <div class="p-4">
            <div class="text-2xl font-bold mb-2">
              Available Sub-Checks
            </div>
            <div>
              Browse and select pre-built checks to add to your benefit.
            </div>
          </div>

          <table class="table-auto w-full mt-4 border-collapse">
            <thead>
              <tr>
                <th class="subcheck-table-header">Select</th>
                <th class="subcheck-table-header">Check Name</th>
                <th class="subcheck-table-header">Description</th>
              </tr>
            </thead>
            <tbody>
              {availableChecks() && availableChecks().map((check) => (
                <EligibilityCheckRow
                  check={check}
                  selectedChecks={benefit().checks}
                  onToggle={() => onSubcheckToggle(check)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div class="flex-1">
          <div class="px-4 pb-4 text-2xl font-bold">
            Selected Sub-Checks for {benefit().name}
          </div>

          <div class="px-4">
            {benefit().checks.length === 0 && (
              <div class="text-gray-500">
                No sub-checks selected. Use the checkboxes to add sub-checks to this benefit.
              </div>
            )}
            {benefit().checks.length > 0 && (
              <>
                {benefit().checks.map((check, checkIndex) => (
                  <CheckConfigurationContext.Provider value={{check, checkIndex}}>
                    <SelectedEligibilityCheck/>
                  </CheckConfigurationContext.Provider>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


const EligibilityCheckRow = (
  { check, selectedChecks, onToggle }:
  {
    check: EligibilityCheck;
    selectedChecks: EligibilityCheck[];
    onToggle: (check: EligibilityCheck) => void;
  }
) => {
  const isChecked = () => selectedChecks.some((selected) => selected.id === check.id);

  return (
    <tr>
      <td class="subcheck-table-cell border-top">
        <input
          class="rounded-sm border-2 border-gray-400"
          type="checkbox"
          checked={isChecked()}
          onChange={() => onToggle(check)}
        />
      </td>
      <td class="subcheck-table-cell border-top">{titleCase(check.id)}</td>
      <td class="subcheck-table-cell border-top">{check.description}</td>
    </tr>
  );
};

export default ConfigureBenefit;
