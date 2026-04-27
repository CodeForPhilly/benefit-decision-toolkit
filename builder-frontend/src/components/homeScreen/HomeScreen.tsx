import ProjectsList from "@/components/homeScreen/ProjectsList";
import { Accessor, createSignal } from "solid-js";

const HomeScreen = () => {
  return (
    <main class="p-2 text-gray-700">
      <ProjectsList />
    </main>
  );
};
export default HomeScreen;
