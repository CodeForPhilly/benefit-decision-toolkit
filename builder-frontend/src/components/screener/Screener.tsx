import { createSignal, createResource, ErrorBoundary, Show } from "solid-js";
import { useParams } from "@solidjs/router";

import FormRenderer from "./FormRenderer";
import Loading from "@/components/Loading";
import EligibilityResults from "./EligibilityResults";

import { fetchPublishedScreener, evaluatePublishedScreener } from "@/api/publishedScreener";

import type { PublishedScreener, ScreenerResult } from "@/types";

export default function Screener() {
  const params = useParams();

  const [screener] = createResource<PublishedScreener>(() => fetchPublishedScreener(params.publishedScreenerId));
  const [screenerResult, setScreenerResult] = createSignal<ScreenerResult>();

  const submitForm = async (data: any) => {
    try {
      let evaluationResult: ScreenerResult = await evaluatePublishedScreener(params.publishedScreenerId, data);
      setScreenerResult(evaluationResult);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div class="mt-4">
        {screener.loading && <Loading/>}
        {screener() && (
          <div class="flex flex-col lg:flex-row">
            <div class="flex-1 overflow-y-auto p-4">
              <FormRenderer
                schema={screener()?.formSchema || {}}
                submitForm={submitForm}
              />
            </div>
            <Show when={screenerResult()}>
              <div class="flex-1 overflow-y-auto p-4">
                <EligibilityResults screenerResult={screenerResult}/>
              </div>
            </Show>
          </div>
        )}
      </div>
    </>
  );
}
