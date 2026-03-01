import { Accessor, For, Resource, Setter, createSignal } from "solid-js";

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
  const [activeTab, setActiveTab] = createSignal("account");

  const activeCheckConfig: Accessor<CheckModeConfig> = () =>
    mode() === "public" ? PublicCheckConfig : UserDefinedCheckConfig;
  const activeChecks: Accessor<Resource<EligibilityCheck[]>> = () =>
    mode() === "public" ? publicChecks : userDefinedChecks;

  const onAddEligibilityCheck = (check: EligibilityCheck) => {
    const checkConfig: CheckConfig = {
      checkId: check.id,
      checkName: check.name,
      checkVersion: check.version,
      checkModule: check.module,
      checkDescription: check.description,
      evaluationUrl: check.evaluationUrl,
      parameters: {},
      parameterDefinitions: check.parameterDefinitions,
      inputDefinition: check.inputDefinition,
    };
    addCheck(checkConfig);
  };

  return (
    <>
      <div class="p-4">
        <div class="flex justify-between items-center mb-2">
          <div class="text-2xl font-bold">{activeCheckConfig().title}</div>
          <div class="grid w-full grid-cols-2 items-center justify-center rounded-md bg-muted bg-gray-100 p-1 text-gray-500 mb-2 w-xs">
            <button
              onClick={() =>
                mode() === "public"
                  ? setMode("user-defined")
                  : setMode("public")
              }
              class={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded ${
                mode() === "public"
                  ? "bg-white text-gray-950 shadow-sm"
                  : "hover:bg-gray-200"
              }`}
            >
              Public Checks
            </button>
            <button
              onClick={() =>
                mode() === "public"
                  ? setMode("user-defined")
                  : setMode("public")
              }
              class={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded ${
                mode() === "user-defined"
                  ? "bg-white text-gray-950 shadow-sm"
                  : "hover:bg-gray-200"
              }`}
            >
              Custom Checks
            </button>
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
      <td class="eligibility-check-table-cell border-top">{check.version}</td>
    </tr>
  );
};
export default EligibilityCheckListView;
