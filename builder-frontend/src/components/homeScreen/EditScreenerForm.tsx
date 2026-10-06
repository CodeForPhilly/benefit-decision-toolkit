import { createSignal, JSX, Show } from "solid-js";
import { downloadScreener } from "@/api/screenerTransfer";
import TrashIcon from "../icon/TrashIcon";
import DeleteConfirmation from "./DeleteConfirmation";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import Form from "@/components/shared/Form";

export interface EditModalData {
  screenerId: string;
  screenerName: string;
}

interface Props {
  modalData: EditModalData;
  handleEditScreener: (
    screenerId: string,
    data: { screenerName: string },
  ) => Promise<void>;
  handleDeleteScreener: (data: { id: string }) => Promise<void>;
}

export default function EditScreenerForm(props: Props) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = createSignal(false);
  const [error, setError] = createSignal("");
  const [exporting, setExporting] = createSignal(false);
  const [exportError, setExportError] = createSignal("");

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const screenerName = form.get("screenerName");
    if (!screenerName?.toString().trim()) {
      setError("Please enter a screener name.");
    } else {
      try {
        setIsLoading(true);
        const data = { screenerName: screenerName.toString() };
        await props.handleEditScreener(props.modalData.screenerId, data);
        setIsLoading(false);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not update the screener.",
        );
        if (isLoading()) {
          setIsLoading(false);
        }
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const data = { id: props.modalData.screenerId };
      await props.handleDeleteScreener(data);
      setIsLoading(false);
    } catch (e) {
      if (isLoading()) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <h2 class="text-xl font-bold">Edit screener</h2>

        <Form.LabelAbove placeholder="Screener name" htmlFor="screenerName">
          <Form.TextInput value={props.modalData.screenerName} />
        </Form.LabelAbove>
        <Form.FormError>{error()}</Form.FormError>
        <Button variant="secondary" type="submit" disabled={isLoading()}>
          Update
        </Button>
      </Form>

      <hr class="my-4 text-gray-300" />

      <p class="mb-3">
        Download this screener’s saved benefits, checks, and form to share an
        editable copy.
      </p>
      <Button
        variant="outline-primary"
        disabled={exporting() || isLoading()}
        onClick={async () => {
          setExportError("");
          setExporting(true);
          try {
            await downloadScreener(
              props.modalData.screenerId,
              props.modalData.screenerName,
            );
          } catch (failure) {
            setExportError(
              failure instanceof Error
                ? failure.message
                : "Could not export the screener.",
            );
          } finally {
            setExporting(false);
          }
        }}
      >
        {exporting() ? "Exporting…" : "Export screener"}
      </Button>
      <Show when={exportError()}>
        <p role="alert" class="text-red-700 mt-2">
          {exportError()}
        </p>
      </Show>

      <hr class="my-4 text-gray-300" />

      <Button
        variant="outline-danger"
        type="button"
        onClick={() => setIsConfirmationVisible(true)}
      >
        <TrashIcon /> Delete Screener
      </Button>
      <Modal
        show={isConfirmationVisible()}
        onClose={() => setIsConfirmationVisible(false)}
      >
        <DeleteConfirmation
          screenerName={props.modalData.screenerName}
          onCancel={() => setIsConfirmationVisible(false)}
          onDelete={handleDelete}
        />
      </Modal>
    </div>
  );
}
