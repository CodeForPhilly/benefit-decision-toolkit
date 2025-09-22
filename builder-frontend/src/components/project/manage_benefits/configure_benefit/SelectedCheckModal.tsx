import { useContext } from "solid-js";
import { BenefitConfigurationContext, CheckConfigurationContext } from "../contexts";
import { NumberParameter } from "../types";

// Shamelessly stolen from:
// https://stackoverflow.com/questions/64489395/converting-snake-case-string-to-title-case
// Changed to be sentence case rather than title case
const titleCase = (str: string) => {
  return str.replace(
    /^_*(.)|_+(.)/g,
    (s, c, d) => c ? c.toUpperCase() : ' ' + d
  );
}


const AddNewBenefitPopup = (
  { closeModal }: { closeModal: () => void }
) => {
  const {benefit, benefitIndex, setBenefitIndex, setProjectBenefits} = useContext(BenefitConfigurationContext);
  const {check} = useContext(CheckConfigurationContext);
  
  return (
    <div
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 min-h-96">
        <div class="text-2xl mb-4">Configure Check: {titleCase(check.id)}</div>

        <ParameterNumberInput parameter={check.parameters[0] as NumberParameter} parameterIndex={0}/>

        <div class="flex justify-end space-x-2">
          <div
            class="btn-default hover:bg-gray-200"
            onClick={closeModal}
          >
            Close
          </div>
        </div>
      </div>
    </div>
  );
}

const ParameterNumberInput = (
  { parameter, parameterIndex }:
  { parameter: NumberParameter, parameterIndex: number }
) => {
  const {benefitIndex, setProjectBenefits} = useContext(BenefitConfigurationContext);
  const {checkIndex} = useContext(CheckConfigurationContext);

  const onParameterChange = (newValue: number) => {
    console.log(newValue);
    console.log(benefitIndex());
    console.log(checkIndex);
    console.log(parameterIndex);
    setProjectBenefits("benefits", benefitIndex(), "checks", checkIndex, "parameters", parameterIndex, "value", newValue);
  }

  return (
    <div>
      <div class="mb-2 font-bold">{titleCase(parameter.key)} {parameter.required && <span class="text-red-600">*</span>}</div>
      <input
        onInput={(e) => {onParameterChange(Number(e.target.value))}}
        type="number"
      />
    </div>
  );
}


export default AddNewBenefitPopup;
