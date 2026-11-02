import { Accessor, createComputed } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

import type { ScreenerResult } from "@/types";

/** Reconciled so a new evaluation updates rows in place, keeping keyboard focus and tooltips. */
export function createReconciledResults(
  results: Accessor<ScreenerResult | undefined>,
) {
  const [reconciled, setReconciled] = createStore<ScreenerResult>({});
  // Copied because the store writes into what it was given, which the caller still owns.
  createComputed(() =>
    setReconciled(reconcile(structuredClone(results() ?? {}))),
  );
  return reconciled;
}
