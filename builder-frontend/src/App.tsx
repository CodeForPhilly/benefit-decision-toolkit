import { Navigate, Route } from "@solidjs/router";

import Project from "./components/project/Project";
import AuthForm from "./components/auth/AuthForm";
import { useAuth } from "./context/AuthContext";
import HomeScreen from "./components/homeScreen/HomeScreen";
import EligibilityCheckDetail from "./components/homeScreen/eligibilityCheckList/eligibilityCheckDetail/EligibilityCheckDetail";
import Screener from "./components/screener/Screener";
import Loading from "./components/Loading";
import { Match, Switch } from "solid-js";


const ProtectedRoute = (props) => {
  const { user, isAuthLoading } = useAuth();
  
  const userThing = () => {
    console.log(user())
    return user();
  }

  // If user is logged in, render the requested component, otherwise redirect to login
  return (
    <Switch>
      <Match when={isAuthLoading()}>
        <Loading />
      </Match>
      <Match when={userThing() === "loading" || userThing() === null}>
        <Navigate href="/login" />
      </Match>
      <Match when={userThing() !== "loading"}>
        <props.component />
      </Match>
    </Switch>
  );
};

function App() {
  return (
    <>
      <Route path="/login" component={AuthForm} />
      <Route path="/signup" component={AuthForm} />
      <Route path="/" component={() => <ProtectedRoute component={HomeScreen}/>} />
      <Route path="/project/:projectId" component={() => <ProtectedRoute component={Project}/>} />
      <Route path="/check/:checkId" component={() => <ProtectedRoute component={EligibilityCheckDetail}/>} />
      <Route path="/screener/:publishedScreenerId" component={Screener} />          
      <Route path="*" component={() => <div class="p-4">404 - Page Not Found</div>} />
    </>
  );
}
export default App;
