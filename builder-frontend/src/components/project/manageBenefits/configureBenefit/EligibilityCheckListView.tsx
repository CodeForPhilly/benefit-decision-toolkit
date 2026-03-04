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
  title: "Custom eligibility checks",
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
    <div class="h-full flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <div class="flex flex-col gap-2 justify-between mb-2">
          <div class="text-xl font-bold">Check Library</div>
          <div>{activeCheckConfig().description}</div>
          <div class="grid grid-cols-2 items-center justify-center rounded-md bg-muted bg-gray-100 p-1 text-gray-500 mb-2 w-3xs">
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
              Public
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
              Custom
            </button>
          </div>
        </div>
        <input
          class="border-2 rounded-lg p-1 mt-2 border-gray-100 "
          placeholder="Search"
        ></input>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto p-4 grid gap-3 content-start">
        <For each={activeChecks()()}>
          {(check) => (
            <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div class="p-4">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <span class="text-sm font-semibold text-gray-900">
                    {check.name}
                  </span>
                  <span class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {check.module || "General"}
                  </span>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2">
                  {check.description ||
                    "Determines eligibility based on predefined criteria."}
                </p>
                <div class="flex flex-wrap gap-1 mt-2">
                  {check.parameterDefinitions?.length > 0 ? (
                    check.parameterDefinitions
                      .slice(0, 3)
                      .map((param) => (
                        <span class="text-xs border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          {param.label}
                        </span>
                      ))
                  ) : (
                    <span class="text-xs border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      eligibility check
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
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
