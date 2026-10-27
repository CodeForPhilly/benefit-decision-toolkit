import { Accessor, createEffect } from "solid-js";
import cloneDeep from "lodash/cloneDeep";
import type {
  BenefitDetail,
  BenefitResult,
  OptionalBoolean,
  ScreenerResult,
} from "@/types";

export const SCREENING_RESULTS_CHANGED = "screeningResults.changed";
export const NEXT_STEPS_SHOWN_CHANGED = "screeningResults.nextStepsShown";

export interface ScreeningResultsSnapshot {
  readonly results: ScreenerResult | undefined;
  /** True from an answer edit until results for the latest answers arrive, including failures. */
  readonly pending: boolean;
  /** True when the latest evaluation failed, until one succeeds. Pending stays true meanwhile. */
  readonly failed: boolean;
  readonly mode: "live" | "editor";
}

interface EventBus {
  fire(event: string, payload: object): void;
  on(event: string, listener: (payload: any) => void): void;
  off(event: string, listener: (payload: any) => void): void;
}

/** What fields see before any results, or in a form without screeningResultsModule. */
export const EMPTY_SNAPSHOT: ScreeningResultsSnapshot = Object.freeze({
  results: undefined,
  pending: false,
  failed: false,
  mode: "live",
});

/** One instance per form; results never enter answer data or the saved schema. */
export class ScreeningResultsService {
  static $inject = ["eventBus"];

  private snapshot = EMPTY_SNAPSHOT;
  // Fields get a frozen copy so they can't change the parent's results.
  private liveSource: ScreenerResult | undefined;
  private liveCopy: ScreenerResult | undefined;
  // IDs of the rendered Next steps fields, once per rendering.
  private nextStepsShown: string[] = [];
  private screenerName: string | undefined;
  private reportedNextStepsShown = false;

  constructor(private eventBus: EventBus) {}

  /**
   * Next steps fields call this while rendered, so the page can drop its own completion
   * message only when one is actually showing (not hidden by a condition). Returns the
   * call to make when the field is removed.
   */
  showNextSteps = (fieldId: string): (() => void) => {
    this.nextStepsShown.push(fieldId);
    this.reportNextStepsShown();
    let removed = false;
    return () => {
      if (removed) return;
      removed = true;
      this.nextStepsShown.splice(this.nextStepsShown.indexOf(fieldId), 1);
      // A re-import replaces the field in one render; don't report the gap.
      queueMicrotask(() => this.reportNextStepsShown());
    };
  };

  isNextStepsShown = (): boolean => this.reportedNextStepsShown;

  /** Whether this Next steps field is rendered, so not hidden by a condition. */
  isNextStepsFieldShown = (fieldId: string): boolean =>
    this.nextStepsShown.includes(fieldId);

  private reportNextStepsShown(): void {
    const shown = this.nextStepsShown.length > 0;
    if (shown === this.reportedNextStepsShown) return;
    this.reportedNextStepsShown = shown;
    this.eventBus.fire(NEXT_STEPS_SHOWN_CHANGED, { shown });
  }

  getSnapshot = (): ScreeningResultsSnapshot => this.snapshot;

  /** Read when needed; a rename isn't a results change, so it notifies no one. */
  getScreenerName = (): string | undefined => this.screenerName;

  setScreenerName(name: string | undefined): void {
    this.screenerName = name;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.eventBus.on(SCREENING_RESULTS_CHANGED, listener);
    return () => this.eventBus.off(SCREENING_RESULTS_CHANGED, listener);
  };

  update(
    results: ScreenerResult | undefined,
    pending: boolean,
    failed = false,
  ): void {
    if (results !== this.liveSource) {
      this.liveSource = results;
      this.liveCopy = results && deepFreeze(cloneDeep(results));
    }
    this.publish({
      results: this.liveCopy,
      pending,
      failed,
      mode: "live",
    });
  }

  showEditorSamples(benefits: BenefitDetail[]): void {
    this.publish({
      results: deepFreeze(createEditorResults(benefits)),
      pending: false,
      failed: false,
      mode: "editor",
    });
  }

  private publish(next: ScreeningResultsSnapshot): void {
    if (
      next.results === this.snapshot.results &&
      next.pending === this.snapshot.pending &&
      next.failed === this.snapshot.failed &&
      next.mode === this.snapshot.mode
    )
      return;
    this.snapshot = Object.freeze(next);
    this.eventBus.fire(SCREENING_RESULTS_CHANGED, { snapshot: this.snapshot });
  }
}

const SAMPLE_STATUSES: OptionalBoolean[] = [
  "TRUE",
  "FALSE",
  "UNABLE_TO_DETERMINE",
];
const EXAMPLE_BENEFITS: Record<OptionalBoolean, BenefitDetail> = {
  TRUE: {
    id: "example-eligible",
    name: "Example eligible benefit",
    description: "",
  },
  FALSE: {
    id: "example-ineligible",
    name: "Example ineligible benefit",
    description: "",
  },
  UNABLE_TO_DETERMINE: {
    id: "example-undecided",
    name: "Example undecided benefit",
    description: "",
  },
};

/**
 * Use real benefit IDs so fields can match their content; no contacts or instructions are invented.
 * Clearly named examples cover any outcome the configured benefits don't.
 */
export function createEditorResults(benefits: BenefitDetail[]): ScreenerResult {
  const samples: [BenefitDetail, OptionalBoolean][] = [
    ...benefits.map((benefit, index): [BenefitDetail, OptionalBoolean] => [
      benefit,
      SAMPLE_STATUSES[index % SAMPLE_STATUSES.length],
    ]),
    ...SAMPLE_STATUSES.slice(benefits.length).map(
      (result): [BenefitDetail, OptionalBoolean] => [
        EXAMPLE_BENEFITS[result],
        result,
      ],
    ),
  ];
  return Object.fromEntries(
    samples.map(([benefit, result]): [string, BenefitResult] => {
      return [
        benefit.id,
        {
          name: benefit.name,
          result,
          check_results:
            result === "FALSE"
              ? {
                  "example-requirement": {
                    name: "Example requirement",
                    result: "FALSE",
                    module: "",
                    version: "",
                    parameters: {},
                    inputPaths: [],
                  },
                }
              : {},
        },
      ];
    }),
  );
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

/** Keeps a live form's service in step with its parent's results; call from the owning component. */
export function connectScreeningResults(
  form: { get<T>(name: string): T },
  live: {
    results: Accessor<ScreenerResult | undefined>;
    pending: Accessor<boolean>;
    failed: Accessor<boolean>;
    screenerName?: Accessor<string>;
    onNextStepsShownChange?: (shown: boolean) => void;
  },
): void {
  const service = form.get<ScreeningResultsService>("screeningResults");
  createEffect(() =>
    service.update(live.results(), live.pending(), live.failed()),
  );
  createEffect(() => service.setScreenerName(live.screenerName?.()));
  const { onNextStepsShownChange } = live;
  if (onNextStepsShownChange) {
    form
      .get<EventBus>("eventBus")
      .on(NEXT_STEPS_SHOWN_CHANGED, () =>
        onNextStepsShownChange(service.isNextStepsShown()),
      );
  }
}

export const screeningResultsModule = {
  __init__: ["screeningResults"],
  screeningResults: ["type", ScreeningResultsService],
};
