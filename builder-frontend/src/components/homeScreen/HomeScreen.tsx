import ProjectsList from "@/components/homeScreen/ProjectsList";
import { Accessor, createSignal } from "solid-js";

const HomeScreen = () => {
  return (
    <div class="px-12 py-8 text-gray-700">
      <ProjectsList />
    </div>
  );
};
export default HomeScreen;
