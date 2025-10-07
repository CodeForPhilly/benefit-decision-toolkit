import { Accessor, createSignal, For, Setter, Show } from "solid-js";

import AddNewBenefitModal from "./modals/AddNewBenefitModal";
import ConfirmationModal from "../../../shared/ConfirmationModal";
import SelectExistingBenefitModal from "./modals/SelectExistingBenefitModal";

import screenerBenefitResource from "./screenerBenefitsResource";
import Loading from "../../../Loading";

import type { BenefitDetail } from "../types";


const BenefitList = (
  { screenerId, setBenefitIdToConfigure }:
  { screenerId: Accessor<string>; setBenefitIdToConfigure: Setter<null | string> }
) => {
  const { screenerBenefits, actions, actionInProgress, initialLoadStatus } = screenerBenefitResource(screenerId);

  const [addingNewBenefit, setAddingNewBenefit] = createSignal<boolean>(false);
  const [selectExistingBenefitModal, setSelectExistingBenefitModal] = createSignal<boolean>(false);
  const [benefitIdToRemove, setBenefitIdToRemove] = createSignal<null | string>(null);

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
        <Show when={initialLoadStatus.loading() || actionInProgress()}>
          <Loading/>
        </Show>
        <Show when={!initialLoadStatus.loading() && screenerBenefits().length === 0}>
          <div class="w-full flex text-gray-600 font-bold">
            No benefits found. Please add a new benefit.
          </div>
        </Show>
        <For each={screenerBenefits()}>
          {(benefit, benefitIndex) => {
            return (
              <BenefitCard
                benefit={benefit}
                benefitIndex={benefitIndex}
                setBenefitIdToConfigure={setBenefitIdToConfigure}
                setBenefitIdToRemove={setBenefitIdToRemove}
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
          copyPublicBenefit={actions.copyPublicBenefit}
        />
      }
      {
        benefitIdToRemove() !== null &&
        <ConfirmationModal
          confirmationTitle="Remove Benefit"
          confirmationText="Are you sure you want to remove this benefit? This action cannot be undone."
          callback={() => actions.removeBenefit(benefitIdToRemove()) }
          closeModal={() => setBenefitIdToRemove(null) }
        />
      }
    </div>
  )
};

const BenefitCard = (
  { benefit, benefitIndex, setBenefitIdToConfigure, setBenefitIdToRemove }:
  {
    benefit: BenefitDetail,
    benefitIndex: Accessor<number>,
    setBenefitIdToConfigure: Setter<string>,
    setBenefitIdToRemove: Setter<string>
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
            onClick={() => { setBenefitIdToRemove(benefit.id); } }
          >
            Remove
          </div>
        </div>
      </div>
    </div>
  );
}

export default BenefitList;
