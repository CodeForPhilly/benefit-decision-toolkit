import { createSignal, Accessor, Setter } from "solid-js";
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
            class="btn-default hover:bg-gray-200"
            onClick={() => {setBenefitIndexToConfigure(null)}}
          >
            Back
          </div>
        </div>
      </div>
      <div
        class="
          flex gap-4
          flex-col xl:flex-row"
      >
        <div class="flex-5 border-2 border-gray-200 rounded-lg">
          <div class="p-4">
            <div class="text-2xl font-bold tracking-wide mb-2">
              Available Sub-Checks
            </div>
            <div>
              Browse and select pre-built checks to add to your benefit.
            </div>
          </div>

          <table class="table-auto w-full mt-4 border-collapse">
            <thead>
              <tr>
                <th class="px-4 py-3 text-left text-gray-500 text-lg">Select</th>
                <th class="px-4 py-3 text-left text-gray-500 text-lg">Check Name</th>
                <th class="px-4 py-3 text-left text-gray-500 text-lg">Description</th>
                </tr>
            </thead>
            <tbody>
              {availableChecks() && availableChecks().map((check) => (
                <BenefitCheckRow
                  check={check}
                  selectedChecks={benefitToConfigure().checks}
                  onToggle={() => onSubcheckToggle(check)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div class="flex-2 border-2 border-gray-200 rounded-lg">
          <div class="p-4 text-2xl font-bold tracking-wide">
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
                  <>
                    <div class="text-xl mb-2">{titleCase(check.id)}</div>
                    <div>{check.description}</div>
                  </>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type BenefitCheckRowProps = {
  check: EligibilityCheck;
  selectedChecks: EligibilityCheck[];
  onToggle: (check: EligibilityCheck) => void;
};

const BenefitCheckRow = ({ check, selectedChecks, onToggle }: BenefitCheckRowProps) => {
  const isChecked = () => selectedChecks.some((selected) => selected.id === check.id);

  return (
    <tr>
      <td class="border-top border-gray-300 px-4 py-3">
        <input
          class="rounded-sm border-2 border-gray-400"
          type="checkbox"
          checked={isChecked()}
          onChange={() => onToggle(check)}
        />
      </td>
      <td class="border-top border-gray-300 px-4 py-3">{titleCase(check.id)}</td>
      <td class="border-top border-gray-300 px-4 py-3">{check.description}</td>
    </tr>
  );
};

export default ConfigureBenefit;
