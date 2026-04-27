const ConfirmationModal = ({
  confirmationTitle,
  confirmationText,
  callback,
  closeModal,
}: {
  confirmationTitle: string;
  confirmationText: string;
  callback: () => void;
  closeModal: () => void;
}) => {
  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80">
        <h2 class="text-2xl font-bold mb-3">{confirmationTitle}</h2>
        <p class="mb-4">{confirmationText}</p>
        <div class="flex justify-end space-x-2">
          <button class="btn-default hover:bg-gray-200" onClick={closeModal}>
            Cancel
          </button>
          <button
            class="btn-default bg-sky-600 hover:bg-sky-700 text-white"
            onClick={() => {
              callback();
              closeModal();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmationModal;
