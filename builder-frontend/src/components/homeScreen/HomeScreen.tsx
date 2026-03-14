import { Accessor, createSignal, Match, Switch } from "solid-js";

import EligibilityChecksList from "./eligibilityCheckList/EligibilityChecksList";
import ProjectsList from "./ProjectsList";
import Header from "../Header/Header";

import BdtNavbar, { NavbarProps } from "@/components/shared/BdtNavbar";
import { getAccountHooks } from "@/api/account";
0;

const HomeScreen = () => {
  const [screenMode, setScreenMode] = createSignal<"screeners" | "checks">(
    "screeners",
  );

  const handleTestHook = () => {
    getAccountHooks().then((result) => {
      if (result.success) {
        console.log(result);
      }
    });
  };

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
        {
          key: "testAccountHooks",
          label: "Test Account Hooks",
          onClick: handleTestHook,
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
