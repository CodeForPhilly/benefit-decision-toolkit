import { Button } from "@/components/shared/Button";
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
        <Button
          variant="outline-secondary"
          onClick={() => props.onCancel()}
          type="button"
        >
          Cancel
        </Button>
        <Button
          variant="outline-danger"
          onClick={() => props.onDelete()}
          type="button"
        >
          <TrashIcon /> Delete Screener
        </Button>
      </div>
    </div>
  );
}
