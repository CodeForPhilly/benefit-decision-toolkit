import { createSignal, JSX } from "solid-js";

import { Button } from "@/components/shared/Button";
import Form from "@/components/shared/Form";
import { Modal } from "@/components/shared/Modal";

import "@/components/shared/ComponentLibrary.css";

export const ComponentLibrary = () => {
  const handleSubmitForm: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (
    e,
  ) => {
    e.preventDefault();
    alert("Form submitted!");
  };
  return (
    <div class="flex flex-col gap-1 library-wrapper">
      <h1>Component Library</h1>
      <div>
        <button class="my-button">Button styled using CSS</button>
      </div>
      <div>
        <Button variant="primary">Primary button component</Button>
        <Button variant="secondary">Secondary button component</Button>
        <Button variant="tertiary">Tertiary button component</Button>
        <Button variant="danger">Danger button component</Button>
      </div>
      <div>
        <Button variant="outline-primary">Primary button component</Button>
        <Button variant="outline-secondary">Secondary button component</Button>
        <Button variant="outline-tertiary">Tertiary button component</Button>
        <Button variant="outline-danger">Danger button component</Button>
      </div>
      <div>
        <h1>
          Form with placeholder text that moves above text input when focused or
          has value.
        </h1>
        <Form onSubmit={handleSubmitForm}>
          <Form.LabelAbove
            placeholder="Optional field placeholder text"
            htmlFor="component-lib-optional-field"
          >
            <Form.TextInput />
          </Form.LabelAbove>
          <Form.LabelAbove
            placeholder="Required field placeholder text"
            htmlFor="component-library-required-field"
          >
            <Form.TextInput required={true} />
          </Form.LabelAbove>
          <Form.LabelAbove
            placeholder="Disabled field placeholder text"
            htmlFor="component-library-disabled-field"
          >
            <Form.TextInput disabled={true} />
          </Form.LabelAbove>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </div>
      <div>
        <ModalForm />
      </div>
    </div>
  );
};

const ModalForm = () => {
  const [showModal, setShowModal] = createSignal(false);
  const handleSubmitForm: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (
    e,
  ) => {
    e.preventDefault();
    alert("Submitted the form from the modal!");
    setShowModal(false);
  };
  return (
    <>
      <Button variant="primary" onClick={() => setShowModal(true)}>
        Open modal with form
      </Button>
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <h1>Enter the required information in the form</h1>
        <Form onSubmit={handleSubmitForm}>
          <Form.LabelAbove
            placeholder="Optional field placeholder text"
            htmlFor="component-lib-modal-field"
          >
            <Form.TextInput />
          </Form.LabelAbove>

          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </Modal>
    </>
  );
};
