import { createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import { publishScreener } from "../../api/screener";

export default function Publish({ project, refetchProject }) {
  const [isLoading, setIsLoading] = createSignal(false);

  const screenerName = () => { return project()?.screenerName };
  const isPublished = () => { return project()?.publishedScreenerId !== null };
  const lastPublishDate = () => { return project()?.lastPublishDate };
  const screenerUrl = () => {
    return window.location.protocol + "//" +window.location.host + "/screener/" + project()?.publishedScreenerId;
  };

  const { projectId } = useParams();

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      await publishScreener(projectId);
      refetchProject();
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
    <div class="py-8 flex justify-center">
      <div class="px-8 py-4 w-xl border-1 shadow-sm border-gray-200">
        <div class="text-xl">{screenerName()}</div>
        <div class="mt-4 flex flex-col gap-2">
          <div class=" flex gap-4">
            <div class="text-sm font-bold">Screener URL:</div>
            {isPublished() ? (
              <a href={screenerUrl()} target="_blank" rel="noopener noreferrer">
                {screenerUrl()}
              </a>
            ) : (
              <a>Deploy screener to create public url.</a>
            )}
          </div>
          <div class="flex gap-4">
            <div class="text-sm font-bold">Last Published Date:</div>
            {lastPublishDate() ? (
              <div>{formattedDate(lastPublishDate())}</div>
            ) : (
              <div>Not yet published</div>
            )}
          </div>
        </div>
        <div class="mt-4 flex flex-col gap-2">
          <button
            onClick={handlePublish}
            class="w-80 bg-gray-800 font-bold text-gray-50 rounded px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
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
