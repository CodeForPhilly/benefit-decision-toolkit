import { For, createResource, createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Header from "../Header";
import {
  fetchProjects,
  updateScreener,
  deleteScreener,
  createNewScreener,
} from "../../api/screener";
import NewScreenerForm from "./NewScreenerForm";
import MenuIcon from "../icon/MenuIcon";
import EditScreenerForm from "./EditScreenerForm";
import { useAuth } from "../../context/AuthContext";
export default function ProjectsList({ clearUserState }) {
  const [data, { refetch }] = createResource(fetchProjects);
  const [isNewScreenerModalVisible, setIsNewScreenerModalVisible] =
    createSignal(false);
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
      refetch();
      setIsEditgModalVisible(false);
    } catch (e) {
      console.log("Error editing screener", e);
    }
  };

  const handleDeleteScreener = async (screenerData) => {
    try {
      await deleteScreener(screenerData);
      refetch();
      setIsEditgModalVisible(false);
    } catch (e) {
      console.log("Error deleting screener", e);
    }
  };

  return (
    <>
      <div>
        <Header clearUserState={clearUserState}></Header>
        <Show when={data} fallback={<div>Loading...</div>}>
          <div className="flex flex-wrap gap-4 p-4 w-100">
            <div
              onClick={() => setIsNewScreenerModalVisible(true)}
              class="rounded-lg p-4 w-80 h-60 flex justify-center border-6 shadow-md border-gray-300  hover:shadow-lg hover:bg-gray-100"
            >
              <div className="flex items-center text-2xl font-bold">
                Create new screener
              </div>
            </div>
            <For each={data()}>
              {(item) =>
                item && (
                  <div
                    onClick={() => navigateToProject(item)}
                    class="rounded-lg p-4 w-80 h-60 border-1 shadow-md border-gray-300  hover:shadow-lg hover:bg-gray-100"
                  >
                    <div className="flex justify-between gap-4">
                      <div className="text-xl font-bold">
                        {item.screenerName}
                      </div>
                      <div
                        className="hover:cursor-pointer"
                        onClick={(e) => handleProjectMenuClicked(e, item)}
                      >
                        <MenuIcon></MenuIcon>
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
