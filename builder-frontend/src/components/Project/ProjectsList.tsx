import { For, Show, createResource, createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";

import EditScreenerForm from "./EditScreenerForm";
import NewScreenerForm from "./NewScreenerForm";
import MenuIcon from "../icon/MenuIcon";

import {
  fetchProjects, updateScreener, deleteScreener, createNewScreener,
} from "@/api/screener";
import { useAuth } from "@/context/AuthContext";


export default function ProjectsList() {
  const [projectList, { refetch: refetchProjectList }] = createResource(fetchProjects);
  const [isNewScreenerModalVisible, setIsNewScreenerModalVisible] = createSignal(false);
  const [isEditModalVisible, setIsEditgModalVisible] = createSignal(false);
  const [editModelData, setEditModalData] = createSignal();
  const navigate = useNavigate();
  const { user } = useAuth();

  onMount(() => {
    if (user() === null) {
      navigate("/login", { replace: true });
    }
  });

  const navigateToProject = (project) => {
    navigate("/project/" + project.id);
  };

  const handleCreateNewScreener = async (screenerData) => {
    try {
      const newScreener = await createNewScreener(screenerData);
      navigate(`/project/${newScreener.id}`);
    } catch (e) {
      console.log("Error creating screener", e);
    }
  };

  const handleProjectMenuClicked = (e, screenerData) => {
    e.stopPropagation();
    setEditModalData(screenerData);
    setIsEditgModalVisible(true);
  };

  const handleUpdateScreener = async (screenerData) => {
    try {
      await updateScreener(screenerData);
      refetchProjectList();
      setIsEditgModalVisible(false);
    } catch (e) {
      console.log("Error editing screener", e);
    }
  };

  const handleDeleteScreener = async (screenerData) => {
    try {
      await deleteScreener(screenerData);
      refetchProjectList();
      setIsEditgModalVisible(false);
    } catch (e) {
      console.log("Error deleting screener", e);
    }
  };

  return (
    <>
      <div>
        <Show when={projectList} fallback={<div>Loading...</div>}>
          <div class="flex flex-wrap gap-4 p-4 w-100">
            <div
              onClick={() => setIsNewScreenerModalVisible(true)}
              class="
                p-4 w-80 h-60 flex justify-center cursor-pointer
                border-4 border-gray-300 rounded-lg
                shadow-md hover:shadow-lg hover:bg-gray-200"
            >
              <div class="flex items-center text-2xl font-bold">
                Create new screener
              </div>
            </div>
            <Show when={projectList.loading}>
              <div class="w-80 h-60 flex items-center justify-center border-2 border-gray-300 rounded-lg shadow-md">
                <div class="text-2xl font-bold">
                  Loading screeners...
                </div>
              </div>
            </Show>
            <For each={projectList()}>
              {(item) =>
                item && (
                  <div
                    class="
                      w-80 h-60 relative cursor-pointer
                      border-2 border-gray-300 rounded-lg
                      shadow-md hover:shadow-lg hover:bg-gray-200"
                  >
                    <div
                      class="absolute px-2 top-2 right-2 hover:bg-gray-300 rounded-xl"
                      onClick={(e) => handleProjectMenuClicked(e, item)}
                    >
                      <MenuIcon/>
                    </div>
                    <div
                      onClick={() => navigateToProject(item)}
                      class="h-60 p-4 flex flex-col justify-center items-center"
                    >
                      <div class="text-2xl font-bold">
                        {item.screenerName}
                      </div>
                    </div>
                  </div>
                )
              }
            </For>
          </div>
        </Show>
      </div>
      {isNewScreenerModalVisible() && (
        <NewScreenerForm
          handleCreateNewScreener={handleCreateNewScreener}
          setIsModalVisible={setIsNewScreenerModalVisible}
        ></NewScreenerForm>
      )}
      {isEditModalVisible() && (
        <EditScreenerForm
          handleEditScreener={handleUpdateScreener}
          handleDeleteScreener={handleDeleteScreener}
          setIsEditModalVisible={setIsEditgModalVisible}
          screenerData={editModelData()}
        ></EditScreenerForm>
      )}
    </>
  );
}
