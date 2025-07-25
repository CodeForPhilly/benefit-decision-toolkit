import { createSignal, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import { publishScreener, fetchProject } from "../../api/screener";
const screenerBaseUrl = import.meta.env.VITE_SCREENER_BASE_URL;
export default function Publish({ project }) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [screenerName, setScreenerName] = createSignal();
  const [isPublished, setIsPublished] = createSignal();
  const [lastPublishDate, setLastPublishDate] = createSignal();
  const [screenerUrl, setScreenerUrl] = createSignal();
  const { projectId } = useParams();

  onMount(() => {
    setScreenerState();
  });

  const setScreenerState = () => {
    if (!project()) return;
    setScreenerName(project().name);
    setIsPublished(project().published);
    setLastPublishDate(project().lastPublishDate);
    setScreenerUrl(screenerBaseUrl + "screener/" + project().id);
  };

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      await publishScreener(projectId);
      const screenerData = await fetchProject(projectId);
      setScreenerState();
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const formattedDate = (isoString) => {
    const trimmed = isoString.replace(/\.\d{3,}Z$/, "Z");
    const date = new Date(trimmed);

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <div className="py-8 flex justify-center">
      <div className="px-8 py-4 w-xl border-1 shadow-sm border-gray-200">
        <div className="text-xl">{screenerName()}</div>
        <div className="mt-4 flex flex-col gap-2">
          <div className=" flex gap-4">
            <div className="text-sm font-bold">Screener URL:</div>
            {isPublished() ? (
              <a href={screenerUrl()} target="_blank" rel="noopener noreferrer">
                {screenerUrl()}
              </a>
            ) : (
              <a>Deploy screener to create public url.</a>
            )}
          </div>
          <div className="flex gap-4">
            <div className="text-sm font-bold">Last Published Date:</div>
            {lastPublishDate() ? (
              <div>{formattedDate(lastPublishDate())}</div>
            ) : (
              <div>Not yet published</div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={handlePublish}
            className="w-80 bg-gray-800 font-bold text-gray-50 rounded px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
            disabled={isLoading()}
          >
            Deploy Screener
          </button>
          {lastPublishDate() ? (
            <div>Deploy current working version to your public screener</div>
          ) : (
            <div>Click to make your screener availble through a public URL</div>
          )}
        </div>
      </div>
    </div>
  );
}
