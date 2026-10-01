import { Accessor, createResource, createSignal, For, Show } from "solid-js";
import type { CustomCheckWithDmn } from "@/types";
import { fetchCheck, getRelatedPublishedChecks } from "@/api/check";
import { Button } from "@/components/shared/Button";
import { matchesPublishedCheck, sortPublishedChecks } from "./checkPublication";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
const formattedDate = (datePublished?: number | null) =>
  datePublished == null ? "--" : dateFormat.format(new Date(datePublished));

const PublishCheck = (props: {
  eligibilityCheck: Accessor<CustomCheckWithDmn>;
  publishCheck: (checkId: string) => Promise<void>;
  hasUnsavedDmnChanges: Accessor<boolean>;
  saveDmnChanges: () => Promise<void>;
}) => {
  const [publication, { refetch }] = createResource(
    () => props.eligibilityCheck().id,
    async (id) => {
      const versions = sortPublishedChecks(await getRelatedPublishedChecks(id));
      const latest = versions.length
        ? ((await fetchCheck(versions[0].id)) as CustomCheckWithDmn)
        : undefined;
      return { versions, latest };
    },
  );
  const [publishing, setPublishing] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const latest = () => (publication.error ? undefined : publication()?.latest);
  const unchanged = () => {
    const published = latest();
    return (
      !!published && matchesPublishedCheck(props.eligibilityCheck(), published)
    );
  };

  const handlePublish = async () => {
    if (publishing() || publication.loading || publication.error || unchanged())
      return;
    setPublishing(true);
    setError("");
    setSuccess("");
    try {
      await props.publishCheck(props.eligibilityCheck().id);
      setSuccess(
        "Check published. The new version is available when adding checks to a benefit.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not publish check. Please try again.",
      );
      setPublishing(false);
      return;
    }
    try {
      await refetch();
    } catch {
      // Publication succeeded. The resource's error state offers a refresh retry.
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div class="p-4 md:p-12">
      <h1 class="text-3xl font-bold tracking-wide mb-2">
        {props.eligibilityCheck().name}
      </h1>
      <p class="text-xl mb-4">{props.eligibilityCheck().description}</p>
      <p class="mb-4 text-gray-700">
        Publishing creates a version of all saved changes, including the name,
        parameters, and check logic, for use in screeners. Save and test your
        changes before publishing. Existing benefits keep the version they
        already use; to use the new version, remove the old check and add the
        new one in Configure Benefit.
      </p>
      <Show when={props.hasUnsavedDmnChanges()}>
        <div class="mb-4 rounded border border-yellow-400 p-4">
          <p class="font-bold">Unsaved DMN edits</p>
          <p class="mb-2">
            The DMN Definition has edits that are not saved. Publishing includes
            only saved changes.
          </p>
          <Button
            variant="outline-secondary"
            disabled={publishing()}
            onClick={() => void props.saveDmnChanges()}
          >
            Save DMN edits
          </Button>
        </div>
      </Show>
      <Show
        when={!publication.error}
        fallback={
          <div role="alert" class="mb-4 text-red-700">
            Could not load publication status or published versions.
            <Button
              variant="outline-secondary"
              class="ml-2"
              onClick={() => void Promise.resolve(refetch()).catch(() => {})}
            >
              Retry
            </Button>
          </div>
        }
      >
        <Show
          when={!publication.loading}
          fallback={<p class="mb-4">Loading publication status...</p>}
        >
          <div class="mb-4 rounded border border-gray-300 p-4" role="status">
            <p class="font-bold">
              {latest()
                ? unchanged()
                  ? "All saved changes published"
                  : "Unpublished changes"
                : "Not yet published"}
            </p>
            <Show
              when={latest()}
              fallback={
                <p>
                  Publish this draft to make it available when adding checks to
                  a benefit.
                </p>
              }
            >
              {(published) => (
                <>
                  <p>
                    Latest published version: {published().name} —{" "}
                    {published().version}
                  </p>
                  <Show when={!unchanged()}>
                    <p>
                      Publish a new version to make your saved changes
                      available.
                    </p>
                  </Show>
                </>
              )}
            </Show>
          </div>
        </Show>
      </Show>
      <Button
        onClick={handlePublish}
        disabled={
          publishing() ||
          publication.loading ||
          !!publication.error ||
          unchanged()
        }
      >
        {publishing() ? "Publishing..." : "Publish Check"}
      </Button>
      <Show when={error()}>
        <p role="alert" class="mt-3 text-red-700">
          {error()}
        </p>
      </Show>
      <Show when={success()}>
        <p role="status" class="mt-3 text-green-800">
          {success()}
        </p>
      </Show>
      <section class="mt-8">
        <h2 class="text-2xl font-bold mb-4">Published Versions</h2>
        <Show when={!publication.error && !publication.loading}>
          <Show
            when={publication()?.versions.length}
            fallback={<p>No published versions yet.</p>}
          >
            <div class="flex flex-wrap gap-4">
              <For each={publication()?.versions}>
                {(check) => (
                  <div class="relative p-4 w-96 border-2 border-gray-200 rounded">
                    <div class="text-lg font-bold text-gray-800 mb-2">
                      {check.name} - {check.version}
                    </div>
                    <div>
                      <span class="font-bold">Module:</span> {check.module}
                    </div>
                    <div>
                      <span class="font-bold">Number of Parameters:</span>{" "}
                      {check.parameterDefinitions?.length || 0}
                    </div>
                    <div>
                      <span class="font-bold">Date Published:</span>{" "}
                      {formattedDate(check.datePublished)}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </section>
    </div>
  );
};

export default PublishCheck;
