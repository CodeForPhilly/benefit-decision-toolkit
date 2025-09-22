import { CheckConfigurationContext } from "../contexts";
import { createSignal, useContext } from "solid-js";
import SelectedCheckModal from "./SelectedCheckModal";

// Shamelessly stolen from:
// https://stackoverflow.com/questions/64489395/converting-snake-case-string-to-title-case
// Changed to be sentence case rather than title case
const titleCase = (str: string) => {
  return str.replace(
    /^_*(.)|_+(.)/g,
    (s, c, d) => c ? c.toUpperCase() : ' ' + d
  );
}


const SelectedEligibilityCheck = () => {
  const {check} = useContext(CheckConfigurationContext);

  const [configuringCheck, setConfiguringCheck] = createSignal(false);

  const unfilledRequiredParameters = () => {return check.parameters.filter(
    (param) => param.required && param.value === undefined
  )};

  return (
    <>
      <div onClick={() => { setConfiguringCheck(true) }} class="mb-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-200 cursor-pointer select-none">
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
        {unfilledRequiredParameters().length > 0 && (
          <div class="mt-2 text-yellow-700 font-bold">
            Warning: This check has required parameter(s) that are not configured. Click here to edit.
          </div>
        )}
      </div>
      {
        configuringCheck() &&
        <SelectedCheckModal
          closeModal={() => { setConfiguringCheck(false); }}
        />
      }
    </>
  );
};
export default SelectedEligibilityCheck;