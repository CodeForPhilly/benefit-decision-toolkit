import { Show, createResource, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";

import type { Project } from "@/types";
import { fetchProjects } from "@/api/screener";
import { useAuth } from "@/context/AuthContext";
import { NewProjectCard } from "@/components/Project/NewProjectCard";
import ProjectsList from "@/components/Project/ProjectsList";

import "./Projects.css";

export default function Projects() {
  const [projectsList, { refetch }] = createResource<Project[]>(fetchProjects, {
    initialValue: [],
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  onMount(() => {
    // Change to <AuthForm> and redirect user to /projects after sign in?
    if (user() === null) {
      navigate("/login", { replace: true });
    }
  });

  return (
    <div class="flex flex-wrap gap-4 p-4 w-100">
      <NewProjectCard />
      <Show when={projectsList.loading}>
        <div class="w-80 h-60 flex items-center justify-center border-2 border-gray-300 rounded-lg shadow-md">
          <div class="text-2xl font-bold">Loading screeners...</div>
        </div>
      </Show>
      <Show when={projectsList.state === "ready"}>
        <ProjectsList projects={projectsList} refetchProjects={refetch} />
      </Show>
    </div>
  );
}
