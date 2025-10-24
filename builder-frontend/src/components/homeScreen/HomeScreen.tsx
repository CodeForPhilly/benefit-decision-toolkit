import { createSignal, Match, Switch } from "solid-js";

import EligibilityChecksList from "./eligibilityCheckList/EligibilityChecksList";
import ProjectsList from "./ProjectsList"
import Header from "../Header";

const HomeScreen = () => {
  const [screenMode, setScreenMode] = createSignal<"projects" | "checks">("projects");
  return (
    <div>
      <Header/>
      <div class="flex space-x-4 p-4 border-b-2 border-gray-200">
        <div
          class={`btn-default ${screenMode() === "projects" ? "btn-blue" : "btn-gray"}`}
          onClick={() => setScreenMode("projects")}
        >
          Projects List
        </div>
        <div
          class={`btn-default ${screenMode() === "checks" ? "btn-blue" : "btn-gray"}`}
          onClick={() => setScreenMode("checks")}
        >
          Eligibility Checks List
        </div>
      </div>
      <Switch>
        <Match when={screenMode() === "projects"}>
          <ProjectsList />
        </Match>
        <Match when={screenMode() === "checks"}>
          <EligibilityChecksList />
        </Match>
      </Switch>
    </div>
  )
}
export default HomeScreen;