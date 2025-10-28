import { Route } from "@solidjs/router";

import Project from "./components/project/Project";
import AuthForm from "./components/auth/AuthForm";
import { useAuth } from "./context/AuthContext";
import HomeScreen from "./components/homeScreen/HomeScreen";
import EligibilityCheckDetail from "./components/homeScreen/eligibilityCheckList/eligibilityCheckDetail/EligibilityCheckDetail";


function App() {
  const { user } = useAuth();

  // TODO: Loading state does not currently display because it is not within a <Route>
  return (
    <>
      {user() === "loading" ? (
        <div class="pt-40">Loading...</div>
      ) : (
        <>
          <Route path="/login" component={AuthForm} />
          <Route path="/signup" component={AuthForm} />
          <Route path="/" component={HomeScreen as any} />
          <Route path="/project/:projectId" component={Project as any} />
          <Route path="/check/:checkId" component={EligibilityCheckDetail as any} />
          <Route path="*" component={() => <div class="p-4">404 - Page Not Found</div>} />
        </>
      )}
    </>
  );
}
export default App;
