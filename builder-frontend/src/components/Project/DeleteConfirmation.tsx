import { Trash2 } from "lucide-solid";

import { Button } from "@/components/shared/Button";

interface Props {
  id: string;
  screenerName: string;
  onCancel: () => void;
  onDelete: () => void;
}
export default function DeleteConfirmation(props: Props) {
  return (
    <div>
      <h1 class="text-xl font-bold">
        Are you sure you would like to delete {props.screenerName}?
      </h1>
      <div class="pt-8 text-md">
        Once deleted, all associated data will be deleted and cant be recovered.
      </div>
      <div class="flex w-full justify-end gap-4 mt-8">
        <Button variant="outline-secondary" onClick={() => props.onCancel()}>
          Cancel
        </Button>
        <Button variant="outline-danger" onClick={() => props.onDelete()}>
          <Trash2 /> Delete Screener
        </Button>
      </div>
    </div>
  );
}
