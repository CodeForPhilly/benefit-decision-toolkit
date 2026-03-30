import { Route, Router } from "@solidjs/router";

import Project from "./components/project/Project";
import AuthForm from "./components/auth/AuthForm";
import { useAuth } from "./context/AuthContext";
import HomeScreen from "./components/homeScreen/HomeScreen";
import EligibilityCheckDetail from "./components/homeScreen/eligibilityCheckList/eligibilityCheckDetail/EligibilityCheckDetail";
import Screener from "./components/screener/Screener";
import Loading from "./components/Loading";
import { Match, ParentProps, Switch } from "solid-js";
import { ComponentLibrary } from "@/components/shared/ComponentLibrary";
import Header from "@/components/Header/Header";
import ANavBar from "@/components/shared/ANavbar";
import { ViewLayout } from "@/components/homeScreen/ViewLayout";
import ProjectsList from "@/components/homeScreen/ProjectsList";
import EligibilityChecksList from "@/components/homeScreen/eligibilityCheckList/EligibilityChecksList";

const MainLayout = (props: ParentProps) => {
  const { user, isAuthLoading } = useAuth();

  const userThing = () => {
    console.log(user());
    return user();
  };

  const navbarItems = [
    { label: "Projects", href: "/projects" },
    { label: "Eligibility checks", href: "/check" },
  ];

  return (
    <Switch>
      <Match when={isAuthLoading()}>
        <Loading />
      </Match>
      <Match when={user() === null}>
        <AuthForm />
      </Match>
      <Match when={user()}>
        <Header />
        <ANavBar items={navbarItems} />
        {props.children}
      </Match>
    </Switch>
  );
};

function App() {
  return (
    <Router>
      <Route path="/component-test" component={ComponentLibrary} />
      <Route path="/" component={MainLayout}>
        <Route path="/" component={HomeScreen} />
        <Route path="/login" component={AuthForm} />
        <Route path="/signup" component={AuthForm} />
        <Route path="/projects" component={ViewLayout}>
          <Route path="/" component={ProjectsList} />
          <Route path="/:projectId" component={Project} />
        </Route>
        <Route path="/check" component={ViewLayout}>
          <Route path="/" component={EligibilityChecksList} />
          <Route path="/:checkId" component={EligibilityCheckDetail} />
        </Route>
      </Route>
      <Route path="/screener/:publishedScreenerId" component={Screener} />
      <Route
        path="*"
        component={() => <div class="p-4">404 - Page Not Found</div>}
      />
    </Router>
  );
}
export default App;
