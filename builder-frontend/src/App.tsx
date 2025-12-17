import { Match, ParentProps, Switch } from "solid-js";
import { Navigate, Route } from "@solidjs/router";

import AuthForm from "./components/auth/AuthForm";
import { useAuth } from "./context/AuthContext";
import Screener from "./components/screener/Screener";
import Loading from "./components/Loading";
import EligibilityChecksList from "@/components/homeScreen/eligibilityCheckList/EligibilityChecksList";
import EligibilityCheckDetail from "@/components/homeScreen/eligibilityCheckList/eligibilityCheckDetail/EligibilityCheckDetail";
import Header from "@/components/Header";
import ANavBar from "@/components/shared/ANavBar";
import Project from "@/components/Project/ProjectDetails/Project";
import Projects from "@/components/Project/Projects";


const ProtectedRoute = (props: ParentProps) => {
  const { user, isAuthLoading } = useAuth();

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
    <>
      <Route path="/" component={ProtectedRoute}>
        <Route path="/" component={() => <Navigate href="/projects"/>} />
        <Route path="/login" component={AuthForm} />
        <Route path="/signup" component={AuthForm} />
        <Route path="/projects">
          <Route path="/" component={Projects} />
          <Route path="/:projectId" component={Project} />
        </Route>
        <Route path="/check">
          <Route path="/" component={EligibilityChecksList} />
          <Route path="/:checkId" component={EligibilityCheckDetail} />
        </Route>
      </Route>
      <Route path="/screener/:publishedScreenerId" component={Screener} />
      <Route
        path="*"
        component={() => <div class="p-4">404 - Page Not Found</div>}
      />
    </>
  );
}
export default App;
