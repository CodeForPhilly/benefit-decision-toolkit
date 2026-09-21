import { createSignal, createResource, createMemo, Show } from "solid-js";
import { useParams } from "@solidjs/router";

import FormRenderer from "./FormRenderer";
import Loading from "@/components/Loading";
import EligibilityResults from "./EligibilityResults";

import {
  fetchPublishedScreener,
  evaluatePublishedScreener,
} from "@/api/publishedScreener";

import type { PublishedScreener, ScreenerResult } from "@/types";
import {
  getHiddenQuestionPaths,
  haveSameQuestionPaths,
} from "@/utils/questionVotes";

export default function Screener() {
  const params = useParams();

  const [screener] = createResource<PublishedScreener>(() =>
    fetchPublishedScreener(params.publishedScreenerId),
  );
  const [screenerResult, setScreenerResult] = createSignal<ScreenerResult>();
  const [formData, setFormData] = createSignal<any>({});
  const [reviewedBenefits, setReviewedBenefits] = createSignal<string[]>([]);
  const hiddenQuestionPaths = createMemo(
    () => getHiddenQuestionPaths(screenerResult(), new Set(reviewedBenefits())),
    undefined,
    { equals: haveSameQuestionPaths },
  );

  const submitForm = async (data: any) => {
    try {
      setFormData(data);
      let evaluationResult: ScreenerResult = await evaluatePublishedScreener(
        params.publishedScreenerId,
        data,
      );
      setScreenerResult(evaluationResult);
      setReviewedBenefits((current) => (current.length > 0 ? [] : current));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <main class="mt-4">
      {screener.loading && <Loading />}
      {screener() && (
        <div class="flex flex-col lg:flex-row">
          <section class="flex-1 overflow-y-auto p-4">
            <FormRenderer
              schema={screener()?.formSchema || {}}
              formData={formData}
              hiddenQuestionPaths={hiddenQuestionPaths}
              submitForm={submitForm}
            />
          </section>
          <Show when={screenerResult()}>
            <section class="flex-1 overflow-y-auto p-4">
              <EligibilityResults
                screenerResult={screenerResult}
                reviewedBenefits={reviewedBenefits}
                onReviewBenefit={(benefitId) =>
                  setReviewedBenefits((current) =>
                    current.includes(benefitId)
                      ? current
                      : [...current, benefitId],
                  )
                }
              />
            </section>
          </Show>
        </div>
      )}
    </main>
  );
}
