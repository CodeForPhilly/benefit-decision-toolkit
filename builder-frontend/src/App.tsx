import { Route } from "@solidjs/router";

import Project from "./components/project/Project";
import ProjectsList from "./components/projectsList/ProjectsList";
import AuthForm from "./components/auth/AuthForm";
import { useAuth } from "./context/AuthContext";


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
          <Route path="/" component={ProjectsList as any} />
          <Route path="/project/:projectId" component={Project as any} />
          <Route path="*" component={() => <div class="p-4">404 - Page Not Found</div>} />
        </>
      )}
    </>
  );
}
export default App;
