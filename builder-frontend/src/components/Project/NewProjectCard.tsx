import { createSignal } from "solid-js";

import { Modal } from "@/components/shared/Modal";
import NewScreenerForm from "@/components/Project/NewScreenerForm";
import { Button } from "@/components/shared/Button";

export const NewProjectCard = () => {
  const [showModal, setShowModal] = createSignal(false);
  return (
    <div class="new-project-card" onClick={() => setShowModal(true)}>
      <div class="flex items-center text-2xl font-bold">
        Create new screener
      </div>
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <NewScreenerForm />
      </Modal>
    </div>
  );
};
