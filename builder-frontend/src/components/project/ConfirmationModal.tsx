const ConfirmationModal = (
  { confirmationTitle, confirmationText, callback, closeModal }:
  {
    confirmationTitle: string;
    confirmationText: string;
    callback: () => void;
    closeModal: () => void
  }
) => {
  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80">
        <div class="text-2xl mb-4">
          {confirmationTitle}
        </div>
        <div class="mb-4">
          {confirmationText}
        </div>
        <div class="flex justify-end space-x-2">
          <div
            class="btn-default hover:bg-gray-200"
            onClick={closeModal}
          >
            Cancel
          </div>
          <div
            class="btn-default bg-sky-600 hover:bg-sky-700 text-white"
            onClick={
              () => {
                callback();
                closeModal();
              }
            }
          >
            Confirm
          </div>
        </div>
      </div>
    </div>
  )
}
export default ConfirmationModal;
