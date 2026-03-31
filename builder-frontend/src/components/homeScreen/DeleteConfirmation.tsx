import TrashIcon from "../icon/TrashIcon";

interface Props {
  screenerName: string;
  onCancel: () => void;
  onDelete: () => Promise<void>;
}

export default function DeleteConfirmation(props: Props) {
  return (
    <div>
      <div class="text-xl font-bold">
        Are you sure you would like to delete {props.screenerName}?
      </div>
      <div class="pt-8 text-md">
        Once deleted, all associated data will be deleted and cant be recovered.
      </div>
      <div class="flex w-full justify-end gap-4 mt-8">
        <button
          onClick={() => props.onCancel()}
          type="button"
          class="border-2 border-gray-400 text-gray-500 rounded px-3 py-1 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={() => props.onDelete()}
          type="button"
          class="text-red-400 flex border-2 border-red-400 rounded px-3 py-1 hover:bg-red-100"
        >
          <TrashIcon /> Delete Screener
        </button>
      </div>
    </div>
  );
}
