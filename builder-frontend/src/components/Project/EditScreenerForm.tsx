import {
  createSignal,
  JSX,
  ParentProps,
  ResourceActions,
  Show,
} from "solid-js";
import { Trash2 } from "lucide-solid";

import type { Project } from "@/types";
import { deleteScreener, updateScreener } from "@/api/screener";
import Form from "@/components/shared/Form";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import DeleteConfirmation from "./DeleteConfirmation";

interface Props {
  id: string;
  screenerName: string;
  refetchProjects: ResourceActions<Project[]>["refetch"];
}

export default function EditScreenerForm(props: ParentProps<Props>) {
  const [showDelete, setShowDelete] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (e) => {
    e.preventDefault();
    setIsLoading(true);
    const fd = new FormData(e.currentTarget);
    const screenerName = fd.get("screenerName")?.toString() || "";

    if (screenerName.length > 0) {
      setError(null);
      updateScreener({ screenerName, id: props.id })
        .then(() => {
          props.refetchProjects();
          setIsLoading(false);
        })
        .catch((e) => {
          setIsLoading(false);
        });
    } else {
      setError("Please enter a name.");
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setIsLoading(true);
    deleteScreener(props.id)
      .then(() => {
        props.refetchProjects();
        setIsLoading(false);
      })
      .catch((e) => {
        setIsLoading(false);
      });
  };

  return (
    <div>
      <h1 class="text-xl font-bold">Edit screener</h1>

      <Form onSubmit={handleSubmit}>
        <Form.LabelAbove htmlFor="screenerName" placeholder="Screener name">
          <Form.TextInput value={props.screenerName} />
        </Form.LabelAbove>
        <Show when={error()}>
          <div class="text-red-500">{error()}</div>
        </Show>
        <Button variant="secondary" type="submit" disabled={isLoading()}>
          Update
        </Button>
      </Form>

      <hr class="w-100 border-t border-gray-300" />

      <Button variant="outline-danger" onClick={() => setShowDelete(true)}>
        <Trash2 /> Delete Screener
      </Button>

      <Modal show={showDelete} onClose={() => setShowDelete(false)}>
        <DeleteConfirmation
          id={props.id}
          screenerName={props.screenerName}
          onCancel={() => setShowDelete(false)}
          onDelete={handleDelete}
        />
      </Modal>
      {isLoading() && <div>Loading ...</div>}
    </div>
  );
}
