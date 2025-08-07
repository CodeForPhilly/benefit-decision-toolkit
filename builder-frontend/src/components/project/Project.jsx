import { createSignal, onMount, createResource, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import {
  cacheDependency,
  getCachedDependency,
} from "../../storageUtils/storageUtils";
import "../../App.css";
import Header from "../Header";
import FormEditorView from "./FormEditorView";
import Preview from "./Preview";
import Publish from "./Publish";
import KogitoDmnEditorView from "./KogitoDmnEditorView";
import ImportModels from "./ImportModels";
import { fetchProject } from "../../api/screener";
import Loading from "../Loading";
import { fetchModel } from "../../api/models";

function Project({ clearUserState }) {
  const params = useParams();
  const [activeTab, setActiveTab] = createSignal("DMN Editor");
  const [dmnModel, setDmnModel] = createSignal();
  const [formSchema, setFormSchema] = createSignal();
  const [projectDependencies, setProjectDependencies] = createSignal([]);

  const fetchAndCacheProject = async (screenerId) => {
    const projectData = await fetchProject(screenerId);
    setDmnModel(projectData.dmnModel);
    setFormSchema(projectData.formSchema);
    fetchAndCacheProjectDependencies(projectData);
    return projectData;
  };

  const fetchAndCacheProjectDependencies = async (screenerData) => {
    if (screenerData.dependencies) {
      // Read any cached dependencies from session storage and track any deps not cached
      const cachedDeps = [];
      const neededDeps = [];
      for (const dep of screenerData.dependencies) {
        const cachedDep = getCachedDependency(dep);
        if (cachedDep) {
          cachedDeps.push({
            groupId: dep.groupId,
            artifactId: dep.artifactId,
            version: dep.version,
            xml: cachedDep,
          });
        } else {
          neededDeps.push(dep);
        }
      }

      //fetch any dependencies that are not cached
      const dependencyPromises = [];
      for (const dep of neededDeps) {
        dependencyPromises.push(
          await fetchModel(dep.groupId, dep.artifactId, dep.version)
        );
      }

      const dependencies = await Promise.all(dependencyPromises);
      for (const dep of dependencies) {
        cacheDependency(dep);
        cachedDeps.push(dep);
      }

      setProjectDependencies(cachedDeps);
    }
  };

  const [project, { refetchProject }] = createResource(
    params.projectId,
    fetchAndCacheProject
  );

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header clearUserState={clearUserState}></Header>
      {project.loading ? (
        <Loading></Loading>
      ) : (
        <>
          <div class="flex border-b border-gray-200">
            <span className="py-2 px-4 font-bold text-gray-600">
              {" "}
              {project().screenerName}
            </span>
            {[
              "DMN Editor",
              "Import Models",
              "Form Editor",
              "Preview",
              "Publish",
            ].map((tab) => (
              <button
                class={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
                  activeTab() === tab
                    ? "border-b border-gray-700 text-gray-700 hover:bg-gray-200"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleSelectTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {activeTab() == "Form Editor" && (
            <FormEditorView
              formSchema={formSchema}
              setFormSchema={setFormSchema}
            ></FormEditorView>
          )}
          {activeTab() == "DMN Editor" && (
            <KogitoDmnEditorView
              dmnModel={dmnModel}
              setDmnModel={setDmnModel}
              projectDependencies={projectDependencies}
            ></KogitoDmnEditorView>
          )}
          {activeTab() == "Import Models" && (
            <ImportModels
              screener={project}
              dependencies={project().dependencies}
              fetchAndCacheProject={fetchAndCacheProject}
            ></ImportModels>
          )}
          {activeTab() == "Preview" && (
            <Preview formSchema={formSchema}></Preview>
          )}
          {activeTab() == "Publish" && <Publish project={project}></Publish>}
        </>
      )}
    </div>
  );
}

export default Project;
