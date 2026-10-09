import { createSignal, createResource, createMemo, Show } from "solid-js";
import { useParams } from "@solidjs/router";

import FormRenderer from "./FormRenderer";
import Loading from "@/components/Loading";
import EligibilityResults from "./EligibilityResults";

import {
  fetchPublishedScreener,
  evaluatePublishedScreener,
} from "@/api/publishedScreener";

import HiddenQuestionsNotice from "@/components/shared/HiddenQuestionsNotice";
import ScreeningComplete from "@/components/shared/ScreeningComplete";

import type { PublishedScreener, ScreenerResult } from "@/types";
import {
  getUnneededQuestionPaths,
  haveSameQuestionPaths,
} from "@/utils/questionVotes";

export default function Screener() {
  const params = useParams();

  const [screener] = createResource<PublishedScreener>(() =>
    fetchPublishedScreener(params.publishedScreenerId),
  );
  const [screenerResult, setScreenerResult] = createSignal<ScreenerResult>();
  const [formData, setFormData] = createSignal<any>({});
  const [evaluationPending, setEvaluationPending] = createSignal(false);
  let evaluationVersion = 0;
  const [showAllQuestions, setShowAllQuestions] = createSignal(false);
  const unneededQuestionPaths = createMemo(
    () => getUnneededQuestionPaths(screenerResult()),
    undefined,
    { equals: haveSameQuestionPaths },
  );
  const hiddenQuestionPaths = createMemo(
    () => (showAllQuestions() ? [] : unneededQuestionPaths()),
    undefined,
    { equals: haveSameQuestionPaths },
  );

  const submitForm = async (data: any) => {
    const version = ++evaluationVersion;
    setEvaluationPending(true);
    try {
      setFormData(data);
      let evaluationResult: ScreenerResult = await evaluatePublishedScreener(
        params.publishedScreenerId,
        data,
      );
      if (version === evaluationVersion) setScreenerResult(evaluationResult);
    } catch (err) {
      if (version === evaluationVersion) setScreenerResult(undefined);
      console.log(err);
    } finally {
      if (version === evaluationVersion) setEvaluationPending(false);
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
              onDataChange={() => {
                evaluationVersion++;
                setEvaluationPending(true);
              }}
            />
            <ScreeningComplete
              results={screenerResult}
              pending={evaluationPending}
            />
            <HiddenQuestionsNotice
              unneededQuestionCount={() => unneededQuestionPaths().length}
              showAllQuestions={showAllQuestions}
              onToggleShowAllQuestions={() =>
                setShowAllQuestions((current) => !current)
              }
            />
          </section>
          <Show when={screenerResult()}>
            <section class="flex-1 overflow-y-auto p-4">
              <EligibilityResults screenerResult={screenerResult} />
            </section>
          </Show>
        </div>
      )}
    </main>
  );
}
