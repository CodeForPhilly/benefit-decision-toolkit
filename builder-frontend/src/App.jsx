import "./App.css";
import { Route } from "@solidjs/router";
import Project from "./components/project/Project";
import ProjectsList from "./components/projectsList/ProjectsList";
import AuthForm from "./components/auth/AuthForm";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  return (
    <>
      {user() === "loading" ? (
        <div className="pt-40">Loading...</div>
      ) : (
        <>
          <Route path="/login" component={AuthForm} />
          <Route path="/signup" component={AuthForm} />
          <Route path="/" component={ProjectsList} />
          <Route path="/project/:projectId" component={Project} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </>
      )}
    </>
  );
}

export default App;
