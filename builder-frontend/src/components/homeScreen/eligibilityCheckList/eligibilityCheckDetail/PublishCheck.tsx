import { Accessor, createResource, For, Show } from "solid-js";
import { EligibilityCheck } from "@/types";

import { getRelatedPublishedChecks } from "@/api/check";

const PublishCheck = ({
  eligibilityCheck,
  publishCheck,
}: {
  eligibilityCheck: Accessor<EligibilityCheck>;
  publishCheck: (checkId: string) => Promise<void>;
}) => {
  const [relatedPublishedChecks] = createResource(
    () => eligibilityCheck().id,
    getRelatedPublishedChecks
  );

  const sortedPublishedChecks = () => {
    /* Sort published checks by version in descending order */
    const checks = relatedPublishedChecks();
    if (!checks) return [];
    return checks
      .slice()
      .sort((check1, check2) =>
        reverseCompareVersions(check1.version, check2.version)
      );
  };

  // Called reverse compare because we are sorting the largest version number first
  function reverseCompareVersions(a: string, b: string): number {
    const aValues = normalize(a);
    const bValues = normalize(b);

    for (let i = 0; i < 3; i++) {
      if (aValues[i] !== bValues[i]) {
        // The order of this subtraction is what reverses the sort order
        return bValues[i] - aValues[i];
      }
    }
    return 0;
  }

  function normalize(version: string): [number, number, number] {
    const parts = version.split(".").map(Number);

    while (parts.length < 3) {
      parts.push(0);
    }

    return [parts[0], parts[1], parts[2]];
  }

  return (
    <div class="p-12">
      <div class="text-3xl font-bold tracking-wide mb-2">
        {eligibilityCheck().name}
      </div>
      <p class="text-xl mb-4">{eligibilityCheck().description}</p>
      <div
        onClick={() => publishCheck(eligibilityCheck().id)}
        class="btn-default btn-blue"
      >
        Publish Check
      </div>
      <div class="mt-8">
        <div class="text-2xl font-bold mb-4">Published Versions</div>
        <Show
          when={relatedPublishedChecks()}
          fallback={<div>Loading related published checks...</div>}
        >
          <div class="flex flex-wrap gap-4">
            <For each={sortedPublishedChecks()}>
              {(check) => (
                <div class="relative p-4 w-96 border-2 border-gray-200 rounded">
                  <div class="text-lg font-bold text-gray-800 mb-2">
                    {check.name} - {check.version}
                  </div>
                  <div>
                    <div>
                      <span class="font-bold">Module:</span> {check.module}
                    </div>
                    <div>
                      <span class="font-bold">Number of Parameters:</span>{" "}
                      {check.parameterDefinitions.length}
                    </div>
                    <div>
                      <span class="font-bold">Date Published:</span> --
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default PublishCheck;
