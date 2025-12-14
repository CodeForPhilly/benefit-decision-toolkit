import { createSignal, Match, Switch } from "solid-js";
import { Title } from "@solidjs/meta";

import EligibilityChecksList from "./eligibilityCheckList/EligibilityChecksList";
import ProjectsList from "@/components/Project/ProjectsList";

const HomeScreen = () => {
  const [screenMode, setScreenMode] = createSignal<"screeners" | "checks">(
    "screeners",
  );

  return (
    <div>
      <Title>BDT Home</Title>
      <Switch>
        <Match when={screenMode() === "screeners"}>
          <ProjectsList />
        </Match>
        <Match when={screenMode() === "checks"}>
          <EligibilityChecksList />
        </Match>
      </Switch>
    </div>
  );
};
export default HomeScreen;
