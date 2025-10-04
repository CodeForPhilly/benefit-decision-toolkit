import { Accessor, createSignal, For, Setter } from "solid-js";

import AddNewBenefitModal from "./modals/AddNewBenefitModal";
import ConfirmationModal from "../../../shared/ConfirmationModal";
import SelectExistingBenefitModal from "./modals/SelectExistingBenefitModal";

import screenerBenefitResource from "./screenerBenefitsResource";

import type { BenefitDetail } from "../types";


const BenefitList = (
  { screenerId, setBenefitIdToConfigure }:
  { screenerId: string; setBenefitIdToConfigure: Setter<null | string> }
) => {
  const { screenerBenefits, actions, initialLoadStatus } = screenerBenefitResource(screenerId);

  const [addingNewBenefit, setAddingNewBenefit] = createSignal<boolean>(false);
  const [selectExistingBenefitModal, setSelectExistingBenefitModal] = createSignal<boolean>(false);
  const [benefitIndexToRemove, setBenefitIndexToRemove] = createSignal<null | number>(null);

  return (
    <div class="p-5">
      <div class="text-3xl font-bold mb-2 tracking-wide">
        Manage Benefits
      </div>
      <div class="text-lg mb-3">
        Define and organize the benefits available in your screener.
        Each benefit can have associated eligibility checks.
      </div>
      <div
        class="btn-default btn-blue mb-3 mr-1"
        onClick={() => {setAddingNewBenefit(true)}}
      >
        Create New Benefit
      </div>
      <div
        class="btn-default btn-blue mb-3"
        onClick={() => {setSelectExistingBenefitModal(true)}}
      >
        Copy from Existing Benefit
      </div>
      <div
        class="
          grid gap-4 justify-items-center
          grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      >
        <For each={screenerBenefits()}>
          {(benefit, benefitIndex) => {
            return (
              <BenefitCard
                benefit={benefit}
                benefitIndex={benefitIndex}
                setBenefitIdToConfigure={setBenefitIdToConfigure}
                setBenefitIndexToRemove={setBenefitIndexToRemove}
              />
            );
          }}
        </For>
      </div>
      {
        addingNewBenefit() &&
        <AddNewBenefitModal
          closeModal={() => setAddingNewBenefit(false)}
          addNewBenefit={actions.addNewBenefit}
        />
      }
      {
        selectExistingBenefitModal() &&
        <SelectExistingBenefitModal
          closeModal={() => setSelectExistingBenefitModal(false)}
          addNewBenefit={actions.addNewBenefit}
        />
      }
      {
        benefitIndexToRemove() !== null &&
        <ConfirmationModal
          confirmationTitle="Remove Benefit"
          confirmationText="Are you sure you want to remove this benefit? This action cannot be undone."
          callback={() => actions.removeBenefit(benefitIndexToRemove()) }
          closeModal={() => setBenefitIndexToRemove(null) }
        />
      }
    </div>
  )
};

const BenefitCard = (
  { benefit, benefitIndex, setBenefitIdToConfigure, setBenefitIndexToRemove }:
  {
    benefit: BenefitDetail,
    benefitIndex: Accessor<number>,
    setBenefitIdToConfigure: Setter<string>,
    setBenefitIndexToRemove: Setter<number>
  }
) => {
  return (
    <div class="w-full flex">
      <div
        class="
          max-w-lg flex-1 flex flex-col
          border-1 border-gray-300 rounded-lg"
      >
        <div
          id={"benefit-card-details-" + benefit.id}
          class="p-4 border-bottom border-gray-300 flex-1"
        >
          <div class="text-2xl mb-2 font-bold">
            {benefit.name}
          </div>
          <div>
            <span class="font-bold">Description:</span> {benefit.description}
          </div>
        </div>
        <div
          id={"benefit-card-actions-" + benefit.id}
          class="p-4 flex justify-end space-x-2"
        >
          <div
            class="btn-default btn-gray"
            onClick={() => { setBenefitIdToConfigure(benefit.id); } }
          >
            Edit
          </div>
          <div
            class="btn-default btn-red"
            onClick={() => { setBenefitIndexToRemove(benefitIndex()); } }
          >
            Remove
          </div>
        </div>
      </div>
    </div>
  );
}

export default BenefitList;
