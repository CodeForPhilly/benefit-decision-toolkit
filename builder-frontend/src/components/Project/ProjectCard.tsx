import {
  Component,
  createSignal,
  ParentProps,
  ResourceActions,
} from "solid-js";
import { Ellipsis } from "lucide-solid";

import { Modal } from "@/components/shared/Modal";
import EditScreenerForm from "@/components/Project/EditScreenerForm";
import { Project } from "@/types";

interface Props {
  id: string;
  screenerName: string;
  refetchProjects: ResourceActions<Project[]>["refetch"];
}

export const ProjectCard: Component<ParentProps<Props>> = (props) => {
  const [showMenu, setShowMenu] = createSignal(false);

  return (
    <div class="project-card">
      <div class="project-card-menu" onClick={() => setShowMenu(true)}>
        <Ellipsis />
        <Modal show={showMenu} onClose={() => setShowMenu(false)}>
          <EditScreenerForm
            id={props.id}
            screenerName={props.screenerName}
            refetchProjects={props.refetchProjects}
          />
        </Modal>
      </div>
      <a href={`/projects/${props.id}`} class="project-card-link">
        <div class="text-2xl font-bold">{props.screenerName}</div>
      </a>
    </div>
  );
};
