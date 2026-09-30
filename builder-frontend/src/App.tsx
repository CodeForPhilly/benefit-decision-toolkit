import { Route, Router } from "@solidjs/router";

import ScreenerEditor from "./components/screenerEditor/ScreenerEditor";
import AuthForm from "./components/auth/AuthForm";
import { useAuth } from "./context/AuthContext";
import AreaRedirect from "./components/shared/AreaRedirect";
import CustomCheckDetail from "./components/homeScreen/customChecks/customCheckDetail/CustomCheckDetail";
import Screener from "./components/screener/Screener";
import Loading from "./components/Loading";
import { Match, ParentProps, Switch } from "solid-js";
import { ComponentLibrary } from "@/components/shared/ComponentLibrary";
import Header from "@/components/Header/Header";
import { ViewLayout } from "@/components/homeScreen/ViewLayout";
import ScreenersList from "@/components/homeScreen/ScreenersList";
import CustomChecksList from "@/components/homeScreen/customChecks/CustomChecksList";

const MainLayout = (props: ParentProps) => {
  const { user, isAuthLoading, isProvisioningAccount } = useAuth();

  return (
    <Switch>
      <Match when={isAuthLoading() || isProvisioningAccount()}>
        <Loading />
      </Match>
      <Match when={user() === null}>
        <AuthForm />
      </Match>
      <Match when={user()}>
        <Header />
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
        <Route
          path="/"
          component={() => <AreaRedirect from="/" to="/screeners" />}
        />
        <Route
          path={["/projects", "/projects/:screenerId"]}
          component={() => <AreaRedirect from="/projects" to="/screeners" />}
        />
        <Route
          path={["/check", "/check/:checkId"]}
          component={() => <AreaRedirect from="/check" to="/custom-checks" />}
        />
        <Route path="/login" component={AuthForm} />
        <Route path="/signup" component={AuthForm} />
        <Route path="/screeners" component={ViewLayout}>
          <Route path="/" component={ScreenersList} />
          <Route path="/:screenerId" component={ScreenerEditor} />
        </Route>
        <Route path="/custom-checks" component={ViewLayout}>
          <Route path="/" component={CustomChecksList} />
          <Route path="/:checkId" component={CustomCheckDetail} />
        </Route>
      </Route>
      <Route path="/screener/:publishedScreenerId" component={Screener} />
      <Route
        path="*"
        component={() => <main class="p-4">404 - Page Not Found</main>}
      />
    </Router>
  );
}
export default App;
