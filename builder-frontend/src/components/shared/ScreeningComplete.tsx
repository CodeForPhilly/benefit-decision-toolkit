import { Accessor, Show } from "solid-js";
import type { ScreenerResult } from "@/types";

export default function ScreeningComplete({
  results,
  pending,
}: {
  results: Accessor<ScreenerResult | undefined>;
  pending: Accessor<boolean>;
}) {
  const complete = () => {
    const benefits = Object.values(results() ?? {});
    return (
      !pending() &&
      benefits.length > 0 &&
      benefits.every(
        (benefit) => benefit.result === "TRUE" || benefit.result === "FALSE",
      )
    );
  };
  return (
    <Show when={complete()}>
      <p
        role="status"
        class="my-4 rounded border border-green-300 bg-green-50 p-4 text-green-900"
      >
        Screening complete. All benefits have an eligibility decision. Review
        your results.
      </p>
    </Show>
  );
}
