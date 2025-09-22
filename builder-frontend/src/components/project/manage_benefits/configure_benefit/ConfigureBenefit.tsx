import { createEffect, Accessor, Setter, onMount } from "solid-js";
import { SetStoreFunction } from "solid-js/store"

import { ProjectBenefits as ProjectBenefitsType, Benefit } from "../types";
import { createResource } from "solid-js";
import { getAllAvailableChecks } from "./fake_check_endpoints";
import type { EligibilityCheck } from "../types";


// Shamelessly stolen from:
// https://stackoverflow.com/questions/64489395/converting-snake-case-string-to-title-case
// Changed to be sentence case rather than title case
const titleCase = (str: string) => {
  return str.replace(
    /^_*(.)|_+(.)/g,
    (s, c, d) => c ? c.toUpperCase() : ' ' + d
  );
}


const ConfigureBenefit = (
  {
    benefitToConfigure,
    benefitIndexToConfigure,
    setBenefitIndexToConfigure,
    setProjectBenefits
  }:
  {
    benefitToConfigure: Accessor<Benefit>;
    benefitIndexToConfigure: Accessor<number>;
    setBenefitIndexToConfigure: Setter<null | number>;
    setProjectBenefits: SetStoreFunction<ProjectBenefitsType>;
  }
) => {   
  const [availableChecks] = createResource<EligibilityCheck[]>(getAllAvailableChecks);

  createEffect(() => {
    // For dev purposes, auto-add the first available check if none are selected
    // TODO: remove this when we have a more robust UI
    // if (benefitToConfigure().checks.length === 0) {
    //   onSubcheckToggle(availableChecks()[0]);
    // }
  });

  const onSubcheckToggle = (check: EligibilityCheck) => {
    const updatedBenefit: Benefit = { ...benefitToConfigure() };
    const isCheckSelected = updatedBenefit.checks.some((selected) => selected.id === check.id);
    if (isCheckSelected) {
      updatedBenefit.checks = updatedBenefit.checks.filter((selected) => selected.id !== check.id);
    } else {
      updatedBenefit.checks = [...updatedBenefit.checks, check];
    }
    setProjectBenefits("benefits", benefitIndexToConfigure(), updatedBenefit);
  };

  return (
    <div class="p-5">
      <div class="flex mb-4">
        <div class="text-3xl font-bold tracking-wide">
          Configure Benefit: {benefitToConfigure() ? benefitToConfigure().name : "No Benefit Found"}
        </div>
        <div class="ml-auto">
          <div
            class="btn-default btn-gray"
            onClick={() => {setBenefitIndexToConfigure(null)}}
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
                  selectedChecks={benefitToConfigure().checks}
                  onToggle={() => onSubcheckToggle(check)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div class="flex-1">
          <div class="px-4 pb-4 text-2xl font-bold">
            Selected Sub-Checks for {benefitToConfigure().name}
          </div>

          <div class="px-4">
            {benefitToConfigure().checks.length === 0 && (
              <div class="text-gray-500">
                No sub-checks selected. Use the checkboxes to add sub-checks to this benefit.
              </div>
            )}
            {benefitToConfigure().checks.length > 0 && (
              <>
                {benefitToConfigure().checks.map((check) => (
                  <SelectedEligibilityCheck
                    benefitIndex={benefitIndexToConfigure()}
                    check={check}
                    setProjectBenefits={setProjectBenefits}
                  />
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


const SelectedEligibilityCheck = (
  { benefitIndex, check, setProjectBenefits }:
  { benefitIndex: number, check: EligibilityCheck; setProjectBenefits: SetStoreFunction<ProjectBenefitsType>; }
) => {
  const unfilledRequiredParameters = check.parameters.filter(
    (param) => param.required && param.value === undefined
  );

  return (
    <div class="mb-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-200 cursor-pointer select-none">
      <div class="text-xl font-bold mb-2">{titleCase(check.id)}</div>
      <div class="pl-2 [&:has(+div)]:mb-2">{check.description}</div>
      {check.inputs.length > 0 && (
        <div class="[&:has(+div)]:mb-2">
          <div class="text-lg font-bold pl-2">Inputs</div>
          {check.inputs.map((input) => (
            <div class="flex gap-2 pl-4">
              <div class="">{titleCase(input.key)}:</div>
              <div class="">"{input.prompt}"</div>
            </div>
          ))}
        </div>
      )}
      {check.parameters.length > 0 && (
        <div class="[&:has(+div)]:mb-2">
          <div class="text-lg font-bold pl-2">Parameters</div>
          {check.parameters.map((param) => (
            <div class="flex gap-2 pl-4">
              <div class="">{titleCase(param.key)}:</div>
              <div class="">
                {param.value !== undefined ? param.value.toString() : <span class="text-yellow-700">Not configured</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {unfilledRequiredParameters.length > 0 && (
        <div class="mt-2 text-yellow-700 font-bold">
          Warning: This check has required parameter(s) that are not configured. Click here to edit.
        </div>
      )}
    </div>
  );
};

export default ConfigureBenefit;
