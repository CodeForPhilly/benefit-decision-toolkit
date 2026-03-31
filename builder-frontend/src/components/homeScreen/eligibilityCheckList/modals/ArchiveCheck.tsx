interface Props {
  onCancel: () => void;
  onArchive: () => Promise<void>;
}

export const ArchiveCheck = (props: Props) => {
  return (
    <div>
      <div class="text-2xl font-bold mb-3">Archive Check</div>
      <div class="mb-4">
        Are you sure you want to archive this Eligibility Check? This action
        cannot be undone.
      </div>
      <div class="flex justify-end space-x-2">
        <div class="btn-default hover:bg-gray-200" onClick={props.onCancel}>
          Cancel
        </div>
        <div
          class="btn-default bg-sky-600 hover:bg-sky-700 text-white"
          onClick={() => {
            props.onArchive();
            props.onCancel();
          }}
        >
          Confirm
        </div>
      </div>
    </div>
  );
};
