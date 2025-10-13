import TrashIcon from "../icon/TrashIcon";

export default function DeleteConfirmation({
  screenerData,
  setIsConfirmationVisible,
  handleDelete,
}) {
  return (
    <div
      onClick={() => setIsConfirmationVisible(false)}
      className="fixed inset-0 bg-black/10 flex items-center justify-center z-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white px-12 py-8 rounded-xl max-w-100 w-1/2 min-w-80 h-80"
      >
        <div className="text-xl font-bold">
          Are you sure you would like to delete {screenerData.screenerName}?
        </div>
        <div className="pt-8 text-md">
          Once deleted, all associated data will be deleted and cant be
          recovered.
        </div>
        <div className="flex w-full justify-end gap-4 mt-8">
          <button
            onClick={() => setIsConfirmationVisible(false)}
            className="border-2 border-gray-400 text-gray-500 rounded px-3 py-1 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="text-red-400 flex border-2 border-red-400 rounded px-3 py-1 hover:bg-red-100"
          >
            <TrashIcon></TrashIcon>Delete Screener
          </button>
        </div>
      </div>
    </div>
  );
}
