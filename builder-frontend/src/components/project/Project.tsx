import { createSignal, createResource } from "solid-js";
import { useParams } from "@solidjs/router";

import FormEditorView from "./FormEditorView";
import Header from "../Header";
import Loading from "../Loading";
import ManageBenefits from "./manage_benefits";
import Preview from "./Preview";
import Publish from "./Publish";

import {
  cacheDependency, getCachedDependency
} from "../../storageUtils/storageUtils";
import { fetchProject } from "../../api/screener";
import { fetchModel } from "../../api/models";

import "../../App.css";


type TabOption = "Manage Benefits" | "Form Editor" | "Preview" | "Publish";

function Project() {
  const params = useParams();

  const [activeTab, setActiveTab] = createSignal<TabOption>("Manage Benefits");
  const [dmnModel, setDmnModel] = createSignal();
  const [formSchema, setFormSchema] = createSignal();
  const [projectDependencies, setProjectDependencies] = createSignal([]);
  const [forceUpdate, setForceUpdate] = createSignal(0);

  const fetchAndCacheProject = async (keys) => {
    const projectData = await fetchProject(keys[0]);
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

  const [project] = createResource(
    // Using resrouce to more easily track states during refetch
    // However resources only refetch when key has changed.
    // In order to force refetch even thought he projectId hasn't change,
    // including a dummy signal 'forceUpdate' that can be unique for
    // each call to the refetch
    () => [params.projectId, forceUpdate()],
    fetchAndCacheProject
  );

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div class="h-screen flex flex-col">
      <Header/>
      {project.loading ? (
        <Loading/>
      ) : (
        <>
          <div class="flex border-b border-gray-200">
            <span class="py-2 px-4 font-bold text-gray-600">
              {" "}
              {project().screenerName}
            </span>
            {[
              "Manage Benefits",
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
            />
          )}
          {activeTab() == "Manage Benefits" && (
            <ManageBenefits />
          )}
          {activeTab() == "Preview" && (
            <Preview
              project={project}
              formSchema={formSchema}
              dmnModel={dmnModel}
            />
          )}
          {activeTab() == "Publish" && (
            <Publish
              project={project}
              refetchProject={() => setForceUpdate((prev) => prev + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Project;
