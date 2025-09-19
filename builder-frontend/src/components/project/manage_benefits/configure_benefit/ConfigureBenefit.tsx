import { Accessor, Setter } from "solid-js";
import { SetStoreFunction } from "solid-js/store"

import { ProjectBenefits as ProjectBenefitsType, Benefit } from "../types";

const ConfigureBenefit = (
  { benefitToConfigure, setBenefitIdToConfigure, setProjectBenefits }:
  {
    benefitToConfigure: Accessor<Benefit>;
    setBenefitIdToConfigure: Setter<null | string>;
    setProjectBenefits: SetStoreFunction<ProjectBenefitsType>;
  }
) => {
  return (
    <div class="p-5">
      <div class="flex mb-4">
        <div class="text-3xl font-bold tracking-wide">
          Configure Benefit: {benefitToConfigure() ? benefitToConfigure().name : "No Benefit Found"}
        </div>
        <div class="ml-auto">
          <div
            class="btn-default hover:bg-gray-200"
            onClick={() => {setBenefitIdToConfigure(null)}}
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
              <tr>
                <td class="border-top border-gray-300 px-4 py-3"><input type="checkbox" /></td>
                <td class="border-top border-gray-300 px-4 py-3">Example Check 1</td>
                <td class="border-top border-gray-300 px-4 py-3">This is a description of Example Check 1.</td>
              </tr>
              <tr>
                <td class="border-top border-gray-300 px-4 py-3"><input type="checkbox" /></td>
                <td class="border-top border-gray-300 px-4 py-3">Example Check 2</td>
                <td class="border-top border-gray-300 px-4 py-3">This is a description of Example Check 2.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex-2 border-2 border-gray-200 rounded-lg">
          <div class="p-4 text-2xl font-bold tracking-wide">
            Selected Sub-Checks for {benefitToConfigure() ? benefitToConfigure().name : "No Benefit Found"}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ConfigureBenefit;
