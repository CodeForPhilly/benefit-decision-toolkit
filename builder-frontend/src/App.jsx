import "./App.css";
import { createSignal, onMount } from "solid-js";
import { createNewScreener, updateScreener, fetchProject } from "./api/api";
import {
  getSelectedProjectFromStorage,
  clearSessionStorage,
  saveScreenerDataToStorage,
} from "./storageUtils/storageUtils";
import Project from "./components/project/Project";
import ProjectsList from "./components/projectslist/ProjectsList";
import Loading from "./components/Loading";
import AuthForm from "./components/auth/AuthForm";
import { useAuth } from "./context/AuthContext";

function App() {
  const [selectedProject, setSelectedProject] = createSignal();
  const [isLoading, setIsLoading] = createSignal(false);
  const { user } = useAuth();
  const projectName = "Test Project";

  onMount(() => {
    const project = getSelectedProjectFromStorage();
    if (project) {
      console.log(project);
      setSelectedProject(project);
    }
  });

  const handleSelectProject = async (screener) => {
    try {
      if (!screener) {
        setSelectedProject(undefined);
        clearSessionStorage();
      } else {
        setIsLoading(true);
        const screenerData = await fetchProject(screener.id);
        saveScreenerDataToStorage(screenerData);
        setSelectedProject(screenerData);
        setIsLoading(false);
      }
    } catch (e) {
      console.log("Error fetching screener data", e);
      setIsLoading(false);
    }
  };

  const clearUserState = () => {
    setSelectedProject(null);
  };

  const handleCreateNewScreener = async (screenerData) => {
    try {
      const newScreener = await createNewScreener(screenerData);
      setSelectedProject(newScreener);
      sessionStorage.setItem("selectedProject", JSON.stringify(newScreener));
    } catch (e) {
      console.log("Error creating screener", e);
    }
  };

  const handleEditScreener = async (screenerData) => {
    try {
      return await updateScreener(screenerData);
    } catch (e) {
      console.log("Error editing screener", e);
    }
  };

  function content() {
    if (!user()) {
      return <AuthForm></AuthForm>;
    } else if (isLoading()) {
      return <Loading></Loading>;
    } else if (!selectedProject()) {
      return (
        <ProjectsList
          handleCreateNewScreener={handleCreateNewScreener}
          handleEditScreener={handleEditScreener}
          setSelectedProject={handleSelectProject}
          clearUserState={clearUserState}
        ></ProjectsList>
      );
    } else {
      return (
        <Project
          selectedProject={selectedProject}
          setSelectedProject={handleSelectProject}
          clearUserState={clearUserState}
        ></Project>
      );
    }
  }

  return <>{content()}</>;
}

export default App;
