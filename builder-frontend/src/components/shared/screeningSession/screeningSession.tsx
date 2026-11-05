import {
  type Accessor,
  type Component,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import debounce from "lodash.debounce";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import { Form } from "@bpmn-io/form-js-viewer";
import type { State } from "@bpmn-io/form-js-viewer/dist/types/Form";

import CustomFormFieldsModule from "@/components/screenerEditor/formJsExtensions/customFormFields";
import {
  connectScreeningResults,
  screeningResultsModule,
} from "@/components/screenerEditor/formJsExtensions/screeningResults/screeningResults";
import { firstVisibleNextSteps } from "@/components/screenerEditor/formJsExtensions/nextSteps/selection";
import {
  projectNextSteps as projectFieldNextSteps,
  type CrmNextSteps,
} from "@/integrations/nextSteps";
import type { ScreenerResult, ScreeningAnswers } from "@/types";
import { normalizeArrayFieldData } from "@/utils/arrayFieldData";
import {
  getUnneededQuestionPaths,
  haveSameQuestionPaths,
  hideQuestions,
} from "@/utils/questionVotes";
import {
  findFilledUnknownPaths,
  keepUnansweredPaths,
  restoreUnknownAnswers,
} from "@/utils/unknownAnswers";

import "@bpmn-io/form-js/dist/assets/form-js.css";

/** How long answers must stay unchanged before they are evaluated. */
export const EVALUATION_DELAY_MS = 500;

export interface ScreeningSessionOptions {
  schema: Accessor<any>;
  /** Evaluate normalized answers, against the working screener or a published one. */
  evaluate: (answers: ScreeningAnswers) => Promise<ScreenerResult>;
  /**
   * Answers a host provided. Answers missing or null here stay null until the person
   * answers them, rather than taking form-js's empty values.
   */
  initialAnswers?: ScreeningAnswers;
  /** Evaluate as soon as the form loads, rather than waiting for the first edit. */
  evaluateOnLoad?: boolean;
  screenerName?: Accessor<string>;
  /** Called only for the latest answers, never for an evaluation an edit outdated. */
  onResults?: (answers: ScreeningAnswers, results: ScreenerResult) => void;
  /** Called only when evaluating the latest answers fails. */
  onEvaluationFailed?: () => void;
}

export interface ScreeningSession {
  results: Accessor<ScreenerResult | undefined>;
  /** True from an edit until results for the latest answers arrive. */
  stale: Accessor<boolean>;
  /** True once evaluating the latest answers failed, until the next edit. */
  failed: Accessor<boolean>;
  /** True only while the latest answers are being evaluated, not while waiting to send them. */
  loading: Accessor<boolean>;
  /** The normalized answers last sent for evaluation. */
  answersSent: Accessor<ScreeningAnswers>;
  unneededQuestionCount: Accessor<number>;
  showAllQuestions: Accessor<boolean>;
  toggleShowAllQuestions: () => void;
  /** Whether a Next steps field is rendered, so the page can skip its own completion message. */
  nextStepsShown: Accessor<boolean>;
  /** The saved next steps the form currently shows for these results, for CRM hosts. */
  projectNextSteps: (results: ScreenerResult) => CrmNextSteps | undefined;
  /** The form the person answers. Render it once. */
  Form: Component;
}

/** One person's pass through a screener, in Preview or on a published screener. */
export function createScreeningSession(
  options: ScreeningSessionOptions,
): ScreeningSession {
  const {
    schema,
    evaluate,
    initialAnswers,
    evaluateOnLoad,
    screenerName,
    onResults,
    onEvaluationFailed,
  } = options;
  const [results, setResults] = createSignal<ScreenerResult>();
  const [answersSent, setAnswersSent] = createSignal<ScreeningAnswers>(
    initialAnswers ?? {},
  );
  // A failed evaluation keeps the previous results visible while stale, without
  // announcing that screening is complete.
  const [stale, setStale] = createSignal(false);
  const [failed, setFailed] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [showAllQuestions, setShowAllQuestions] = createSignal(false);
  const [nextStepsShown, setNextStepsShown] = createSignal(false);
  const unneededQuestionPaths = createMemo(
    () => getUnneededQuestionPaths(results()),
    undefined,
    { equals: haveSameQuestionPaths },
  );
  const hiddenQuestionPaths = createMemo(
    () => (showAllQuestions() ? [] : unneededQuestionPaths()),
    undefined,
    { equals: haveSameQuestionPaths },
  );

  // Each edit and each evaluation outdates every evaluation still in flight.
  let latestEvaluation = 0;
  onCleanup(() => latestEvaluation++);

  const submit = async (answers: ScreeningAnswers) => {
    const evaluation = ++latestEvaluation;
    setAnswersSent(answers);
    setStale(true);
    setLoading(true);
    try {
      const evaluated = await evaluate(answers);
      if (evaluation !== latestEvaluation) return;
      setResults(evaluated);
      setStale(false);
      setFailed(false);
      onResults?.(answers, evaluated);
    } catch (error) {
      if (evaluation !== latestEvaluation) return;
      setFailed(true);
      onEvaluationFailed?.();
      console.error("Could not evaluate the screener", error);
    } finally {
      if (evaluation === latestEvaluation) setLoading(false);
    }
  };

  let form: Form | undefined;
  // Next steps are judged against the imported schema and answers.
  let imported = false;

  function ScreeningForm() {
    let container!: HTMLDivElement;
    let currentData: ScreeningAnswers = cloneDeep(initialAnswers ?? {});
    let importing = false;
    let unknownPaths: string[][] = [];
    const evaluationAnswers = (data: ScreeningAnswers) =>
      normalizeArrayFieldData(
        schema(),
        restoreUnknownAnswers(data, unknownPaths),
      );

    const importVisibleSchema = async () => {
      if (!form) return;
      // form-js imports synchronously, so clearing this before awaiting ignores
      // only the import's own changes, never an edit made while it settles.
      importing = true;
      let done: Promise<unknown>;
      try {
        // Preserve the live form state, not the last submitted data: answers
        // typed since the pending submit would otherwise be discarded.
        done = form.importSchema(
          hideQuestions(schema(), hiddenQuestionPaths()),
          cloneDeep(currentData),
        );
      } finally {
        importing = false;
      }
      await done;
    };

    createEffect(
      on(
        () => [schema(), hiddenQuestionPaths()] as const,
        () => void importVisibleSchema(),
        { defer: true },
      ),
    );

    onMount(() => {
      const mounted = new Form({
        container,
        additionalModules: [CustomFormFieldsModule, screeningResultsModule],
      });
      form = mounted;
      let disposed = false;
      connectScreeningResults(mounted, {
        schema,
        evaluatedAnswers: answersSent,
        results,
        screenerName,
        pending: stale,
        failed,
        onNextStepsShownChange: setNextStepsShown,
      });
      const debouncedSubmit = debounce(
        (data: ScreeningAnswers) => void submit(evaluationAnswers(data)),
        EVALUATION_DELAY_MS,
      );

      mounted
        .importSchema(
          hideQuestions(schema(), hiddenQuestionPaths()),
          initialAnswers ?? {},
        )
        .then(() => {
          if (disposed) return;
          imported = true;
          currentData = cloneDeep(mounted._getState().data);
          if (initialAnswers) {
            unknownPaths = findFilledUnknownPaths(initialAnswers, currentData);
          }
          if (evaluateOnLoad) void submit(evaluationAnswers(currentData));
          mounted.on("changed", (event: State) => {
            const dataChanged = !isEqual(currentData, event.data);
            currentData = cloneDeep(event.data);
            if (importing || !dataChanged) return;
            unknownPaths = keepUnansweredPaths(unknownPaths, event.data);
            latestEvaluation++;
            setStale(true);
            // Nothing is evaluating the new answers until the delay ends, and
            // no evaluation of them has failed.
            setLoading(false);
            setFailed(false);
            debouncedSubmit(event.data);
          });
        })
        .catch(console.error);

      onCleanup(() => {
        disposed = true;
        imported = false;
        form = undefined;
        debouncedSubmit.cancel();
        mounted.destroy();
      });
    });

    return <div ref={container} />;
  }

  return {
    results,
    stale,
    failed,
    loading,
    answersSent,
    unneededQuestionCount: () => unneededQuestionPaths().length,
    showAllQuestions,
    toggleShowAllQuestions: () => setShowAllQuestions((shown) => !shown),
    nextStepsShown,
    projectNextSteps: (evaluated) =>
      form && imported
        ? projectFieldNextSteps(
            evaluated,
            firstVisibleNextSteps((name) => form!.get(name)),
          )
        : undefined,
    Form: ScreeningForm,
  };
}
