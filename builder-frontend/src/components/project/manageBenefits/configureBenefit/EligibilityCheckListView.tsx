import { Accessor, For, Resource, Setter } from "solid-js";

import { titleCase } from "@/utils/title_case";

import type { CheckConfig, EligibilityCheck } from "@/types";

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
  description:
    "Browse and select your own custom checks to add to your benefit.",
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
const EligibilityCheckListView = ({
  addCheck,
  mode,
  setMode,
  publicChecks,
  userDefinedChecks,
}: {
  addCheck: (newCheck: CheckConfig) => void;
  mode: Accessor<EligibilityCheckListMode>;
  setMode: Setter<EligibilityCheckListMode>;
  publicChecks: Resource<EligibilityCheck[]>;
  userDefinedChecks: Resource<EligibilityCheck[]>;
}) => {
  const activeCheckConfig: Accessor<CheckModeConfig> = () =>
    mode() === "public" ? PublicCheckConfig : UserDefinedCheckConfig;
  const activeChecks: Accessor<Resource<EligibilityCheck[]>> = () =>
    mode() === "public" ? publicChecks : userDefinedChecks;

  const onAddEligibilityCheck = (check: EligibilityCheck) => {
    const checkConfig: CheckConfig = {
      checkId: check.id,
      checkName: check.name,
      parameters: {},
    };
    addCheck(checkConfig);
  };

  return (
    <>
      <div class="p-4">
        <div class="flex items-center mb-2">
          <div class="text-2xl font-bold">{activeCheckConfig().title}</div>
          <div class="ml-auto flex gap-2">
            <For
              each={
                [PublicCheckConfig, UserDefinedCheckConfig] as CheckModeConfig[]
              }
            >
              {(modeOption) => (
                <div
                  class={`btn-default ${
                    mode() === modeOption.mode ? "btn-blue" : "btn-gray"
                  }`}
                  onClick={() => setMode(modeOption.mode)}
                  title={modeOption.buttonTitle}
                >
                  {modeOption.buttonTitle}
                </div>
              )}
            </For>
          </div>
        </div>
        <div>{activeCheckConfig().description}</div>
      </div>
      <table class="table-auto w-full mt-4 border-collapse">
        <thead>
          <tr>
            <th class="eligibility-check-table-header">Add</th>
            <th class="eligibility-check-table-header">Check Name</th>
            <th class="eligibility-check-table-header">Description</th>
            <th class="eligibility-check-table-header">Version</th>
          </tr>
        </thead>
        <tbody>
          {activeChecks().loading && (
            <tr>
              <td colSpan={3} class="p-4 font-bold text-center">
                Loading checks...
              </td>
            </tr>
          )}
          {activeChecks()() && activeChecks()().length === 0 && (
            <tr>
              <td colSpan={3} class="p-4 font-bold text-center text-gray-600">
                No checks available.
              </td>
            </tr>
          )}
          <For each={activeChecks()()}>
            {(check) => (
              <EligibilityCheckRow
                check={check}
                onAdd={() => onAddEligibilityCheck(check)}
              />
            )}
          </For>
        </tbody>
      </table>
    </>
  );
};

const EligibilityCheckRow = ({
  check,
  onAdd,
}: {
  check: EligibilityCheck;
  onAdd: (check: EligibilityCheck) => void;
}) => {
  return (
    <tr>
      <td class="eligibility-check-table-cell border-top">
        <div class="btn-default btn-blue" onClick={() => onAdd(check)}>
          Add
        </div>
      </td>
      <td class="eligibility-check-table-cell border-top">
        {titleCase(check.name)}
      </td>
      <td class="eligibility-check-table-cell border-top">
        {check.description}
      </td>
      <td class="eligibility-check-table-cell border-top">v{check.version}</td>
    </tr>
  );
};
export default EligibilityCheckListView;
