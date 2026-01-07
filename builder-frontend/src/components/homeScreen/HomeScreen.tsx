import { Accessor, createSignal, Match, Switch } from "solid-js";

import EligibilityChecksList from "./eligibilityCheckList/EligibilityChecksList";
import ProjectsList from "./ProjectsList";
import Header from "../Header";

import BdtNavbar, { NavbarProps } from "@/components/shared/BdtNavbar";
0;

const HomeScreen = () => {
  const [screenMode, setScreenMode] = createSignal<"screeners" | "checks">(
    "screeners"
  );

  const navbarDefs: Accessor<NavbarProps> = () => {
    return {
      tabDefs: [
        {
          key: "screeners",
          label: "Screeners",
          onClick: () => setScreenMode("screeners"),
        },
        {
          key: "checks",
          label: "Eligibility checks",
          onClick: () => setScreenMode("checks"),
        },
      ],
      activeTabKey: () => screenMode(),
      titleDef: null,
    };
  };

  return (
    <div>
      <Header />
      <BdtNavbar navProps={navbarDefs} />
      <div class="px-12 py-8 text-gray-700">
        <Switch>
          <Match when={screenMode() === "screeners"}>
            <ProjectsList />
          </Match>
          <Match when={screenMode() === "checks"}>
            <EligibilityChecksList />
          </Match>
        </Switch>
      </div>
    </div>
  );
};
export default HomeScreen;
