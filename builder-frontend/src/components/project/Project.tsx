import { createSignal, createResource, Accessor } from "solid-js";
import { useParams } from "@solidjs/router";

import FormEditorView from "./FormEditorView";
import Header from "../Header";
import Loading from "../Loading";
import ManageBenefits from "./manageBenefits/ManageBenefits";
import Preview from "./preview/Preview";
import Publish from "./Publish";

import { fetchProject } from "@/api/screener";
import BdtNavbar, { NavbarProps } from "@/components/shared/BdtNavbar";


type TabOption = "manageBenefits" | "formEditor" | "preview" | "publish";

function Project() {
  const params = useParams();

  const [activeTab, setActiveTab] = createSignal<TabOption>("manageBenefits");
  const [formSchema, setFormSchema] = createSignal();
  const [forceUpdate, setForceUpdate] = createSignal(0);

  const fetchAndCacheProject = async (keys) => {
    const projectData = await fetchProject(keys[0]);
    setFormSchema(projectData.formSchema);
    return projectData;
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

  const navbarDefs: Accessor<NavbarProps> = () => {
    return {
      tabDefs: [
        { key: "manageBenefits", label: "Manage Benefits", onClick: () => setActiveTab("manageBenefits") },
        { key: "formEditor", label: "Form Editor", onClick: () => setActiveTab("formEditor") },
        { key: "preview", label: "Preview", onClick: () => setActiveTab("preview") },
        { key: "publish", label: "Publish", onClick: () => setActiveTab("publish") },
      ],
      activeTabKey: () => activeTab(),
      titleDef: { label: project().screenerName },
    };
  };

  return (
    <div class="h-screen flex flex-col">
      <Header/>
      {project.loading ? (
        <Loading/>
      ) : (
        <>
          <BdtNavbar navProps={navbarDefs} />
          {activeTab() == "formEditor" && (
            <FormEditorView
              formSchema={formSchema}
              setFormSchema={setFormSchema}
            />
          )}
          {activeTab() == "manageBenefits" && (
            <ManageBenefits />
          )}
          {activeTab() == "preview" && (
            <Preview project={project} formSchema={formSchema}/>
          )}
          {activeTab() == "publish" && (
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
