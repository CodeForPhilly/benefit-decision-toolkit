import { For, Resource, ResourceActions } from "solid-js";

import { Project } from "@/types";
import { ProjectCard } from "@/components/Project/ProjectCard";

interface Props {
  projects: Resource<Project[]>;
  refetchProjects: ResourceActions<Project[]>["refetch"];
}

export default function ProjectsList(props: Props) {
  return (
    <For each={props.projects()}>
      {(item) => (
        <ProjectCard
          id={item.id}
          screenerName={item.screenerName}
          refetchProjects={props.refetchProjects}
        />
      )}
    </For>
  );
}
