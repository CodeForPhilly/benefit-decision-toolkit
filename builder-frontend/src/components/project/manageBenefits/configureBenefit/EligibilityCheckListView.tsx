import { useContext, For, Resource, Accessor, Setter } from "solid-js";

import { BenefitConfigurationContext } from "../contexts";
import { titleCase } from "../../../../utils/title_case";

import type { Benefit, EligibilityCheck } from "../types";


export type EligibilityCheckListMode = "user-defined" | "public";
interface CheckModeConfig {
  mode: EligibilityCheckListMode;
  title: string;
  description: string;
  buttonTitle: string;
}
const PublicCheckConfig: CheckModeConfig = {
  mode: "public",
  title: "Public eligibility checks",
  description: "Browse and select pre-built checks to add to your benefit.",
  buttonTitle: "Public checks",
};
const UserDefinedCheckConfig: CheckModeConfig = {
  mode: "user-defined",
  title: "User defined eligibility checks",
  description: "Browse and select your own custom checks to add to your benefit.",
  buttonTitle: "Your checks",
};

/*
  Renders a list of eligibility checks with checkboxes to select/deselect them for the current benefit.
  Uses CheckModeConfig object to display a different title/description based on the current mode.
  Props:
    - mode: current mode ("user-defined" or "public")
    - setMode: function to change the mode
    - publicChecks: resource containing the list of public eligibility checks
    - userDefinedChecks: resource containing the list of user-defined eligibility checks
*/
const EligibilityCheckListView = (
  { mode, setMode, publicChecks, userDefinedChecks }:
  {
    mode: Accessor<EligibilityCheckListMode>,
    setMode: Setter<EligibilityCheckListMode>,
    publicChecks: Resource<EligibilityCheck[]>,
    userDefinedChecks: Resource<EligibilityCheck[]>,
  }
) => {
  const {benefit, benefitIndex, setProjectBenefits} = useContext(BenefitConfigurationContext);

  const onEligibilityCheckToggle = (check: EligibilityCheck) => {
    const updatedBenefit: Benefit = { ...benefit() };
    const isCheckSelected = updatedBenefit.checks.some((selected) => selected.id === check.id);
    if (isCheckSelected) {
      updatedBenefit.checks = updatedBenefit.checks.filter((selected) => selected.id !== check.id);
    } else {
      updatedBenefit.checks = [...updatedBenefit.checks, structuredClone(check)];
    }
    setProjectBenefits("benefits", benefitIndex(), updatedBenefit);
  };

  const activeCheckConfig: Accessor<CheckModeConfig> = (
    () => mode() === "public" ? PublicCheckConfig : UserDefinedCheckConfig
  );
  const activeChecks: Accessor<Resource<EligibilityCheck[]>> = (
    () => mode() === "public" ? publicChecks : userDefinedChecks
  );

  return (
    <>
      <div class="p-4">
        <div class="flex items-center mb-2">
          <div class="text-2xl font-bold">
            {activeCheckConfig().title}
          </div>
          <div class="ml-auto flex gap-2">
            <For each={[UserDefinedCheckConfig, PublicCheckConfig] as CheckModeConfig[]}>
              {(modeOption) => (
                <div
                  class={`btn-default ${mode() === modeOption.mode ? "btn-blue" : "btn-gray"}`}
                  onClick={() => setMode(modeOption.mode)}
                  title={modeOption.buttonTitle}
                >
                  {modeOption.buttonTitle}
                </div>
              )}
            </For>
          </div>
        </div>
        <div>
          {activeCheckConfig().description}
        </div>
      </div>
      <table class="table-auto w-full mt-4 border-collapse">
        <thead>
          <tr>
            <th class="eligibility-check-table-header">Select</th>
            <th class="eligibility-check-table-header">Check Name</th>
            <th class="eligibility-check-table-header">Description</th>
          </tr>
        </thead>
        <tbody>
          {activeChecks().loading && (
            <tr>
              <td colSpan={3} class="p-4 font-bold text-center">Loading checks...</td>
            </tr>
          )}
          <For each={activeChecks()()}>
            {(check) => (
              <EligibilityCheckRow
                check={check}
                selectedChecks={benefit().checks}
                onToggle={() => onEligibilityCheckToggle(check)}
              />
            )}
          </For>
        </tbody>
      </table>
    </>
  );
};

const EligibilityCheckRow = (
  { check, selectedChecks, onToggle }:
  {
    check: EligibilityCheck;
    selectedChecks: EligibilityCheck[];
    onToggle: (check: EligibilityCheck) => void;
  }
) => {
  const isCheckSelected = () => selectedChecks.some((selected) => selected.id === check.id);

  return (
    <tr>
      <td class="eligibility-check-table-cell border-top">
        <input
          class="rounded-sm border-2 border-gray-400"
          type="checkbox"
          checked={isCheckSelected()}
          onChange={() => onToggle(check)}
        />
      </td>
      <td class="eligibility-check-table-cell border-top">{titleCase(check.id)}</td>
      <td class="eligibility-check-table-cell border-top">{check.description}</td>
    </tr>
  );
};
export default EligibilityCheckListView;
