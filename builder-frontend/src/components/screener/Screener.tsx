import {
  createSignal,
  createResource,
  createEffect,
  Show,
  onCleanup,
} from "solid-js";
import { useParams } from "@solidjs/router";

import Loading from "@/components/Loading";
import EligibilityResults from "./EligibilityResults";

import {
  fetchPublishedScreener,
  evaluatePublishedScreener,
} from "@/api/publishedScreener";

import HiddenQuestionsNotice from "@/components/shared/HiddenQuestionsNotice";
import ScreeningComplete from "@/components/shared/ScreeningComplete";
import { createScreeningSession } from "@/components/shared/screeningSession/screeningSession";

import type { PublishedScreener, ScreeningAnswers } from "@/types";
import {
  createScreeningBridge,
  type ScreeningBridge,
} from "@/integrations/screenerBridge";

export default function Screener() {
  const params = useParams();

  const [screener] = createResource<PublishedScreener>(() =>
    fetchPublishedScreener(params.publishedScreenerId),
  );
  // Answers a connected host provided; a standalone screener has none.
  const [hostAnswers, setHostAnswers] = createSignal<ScreeningAnswers>();
  const [disconnectReason, setDisconnectReason] = createSignal<
    "timeout" | "closed" | "notAllowed"
  >();
  const bridge = createScreeningBridge(params.publishedScreenerId, {
    initialize: (data) => {
      setHostAnswers(data);
      setIntegrationReady(true);
    },
    // Keep the form usable, but make clear results no longer reach the host.
    onDisconnect: (reason) => {
      if (!disconnectReason()) setDisconnectReason(reason);
      setIntegrationReady(true);
    },
  });
  const [integrationReady, setIntegrationReady] = createSignal(!bridge);
  // Start once the screener loads, so the host's origin can be checked against
  // the origins its builder allowed. Only an allowed host gets answers.
  let bridgeStarted = false;
  createEffect(() => {
    if (!bridge || bridgeStarted) return;
    if (screener.error) {
      bridge.fail("SCREENER_UNAVAILABLE");
    } else if (screener.state !== "ready") {
      return;
    } else if (!screener()?.integrationOrigins?.includes(bridge.origin)) {
      bridge.fail("ORIGIN_NOT_ALLOWED");
      setDisconnectReason("notAllowed");
      setIntegrationReady(true);
    }
    bridgeStarted = true;
    bridge.start();
  });
  onCleanup(() => bridge?.dispose());
  return (
    <main class="mt-4">
      {screener.loading && <Loading />}
      <Show when={screener.error}>
        <p class="p-4" role="alert">
          This screener couldn’t be loaded. Check the link, or try again later.
        </p>
      </Show>
      <Show when={!integrationReady() && !screener.error}>
        <p class="p-4" role="status">
          Waiting for information from the connected application…
        </p>
      </Show>
      <Show when={!screener.error && disconnectReason()}>
        {(reason) => (
          <p class="p-4" role="alert">
            {
              {
                timeout:
                  "This screener couldn’t connect to the application that opened it, so results won’t be sent back. To connect, start the screening again from that application.",
                closed:
                  "This screening is no longer connected to the application that opened it, so new results won’t be sent back. To connect, start the screening again from that application.",
                notAllowed: `This screener isn’t set up to send results to ${bridge?.origin}. Its builder can add that origin to the allowed CRM origins and publish it again.`,
              }[reason()]
            }
          </p>
        )}
      </Show>
      <Show when={!screener.error && screener() && integrationReady()}>
        <PublishedScreening
          publishedScreenerId={params.publishedScreenerId}
          screener={screener()!}
          initialAnswers={hostAnswers()}
          bridge={bridge}
        />
      </Show>
    </main>
  );
}

function PublishedScreening(props: {
  publishedScreenerId: string;
  screener: PublishedScreener;
  initialAnswers?: ScreeningAnswers;
  bridge?: ScreeningBridge;
}) {
  const { bridge } = props;
  const session = createScreeningSession({
    schema: () => props.screener.formSchema || {},
    evaluate: (answers) =>
      evaluatePublishedScreener(props.publishedScreenerId, answers),
    initialAnswers: props.initialAnswers,
    // A connected host expects results for its answers right away.
    evaluateOnLoad: props.initialAnswers !== undefined,
    screenerName: () => props.screener.screenerName ?? "",
    // Only a CRM host receives next steps; standalone screeners skip the projection.
    onResults:
      bridge &&
      ((answers, results) =>
        bridge.result(answers, results, session.projectNextSteps(results))),
    onEvaluationFailed: bridge && (() => bridge.error()),
  });

  return (
    <div class="flex flex-col lg:flex-row">
      <section class="flex-1 overflow-y-auto p-4">
        <session.Form />
        <Show when={session.failed()}>
          <p role="alert" class="my-4 text-red-800">
            We couldn't update your results. Check your connection, then change
            an answer to try again.
          </p>
        </Show>
        <Show when={!session.nextStepsShown()}>
          <ScreeningComplete
            results={session.results}
            pending={session.stale}
          />
        </Show>
        <HiddenQuestionsNotice
          unneededQuestionCount={session.unneededQuestionCount}
          showAllQuestions={session.showAllQuestions}
          onToggleShowAllQuestions={session.toggleShowAllQuestions}
        />
      </section>
      <Show when={session.results()}>
        <section class="flex-1 overflow-y-auto p-4">
          <EligibilityResults screenerResult={session.results} />
        </section>
      </Show>
    </div>
  );
}
