import { html } from "htm/preact";
import { render } from "preact";
import { useContext, useState } from "preact/hooks";
import { FormContext, iconsByType, Text } from "@bpmn-io/form-js-viewer";
import { NextStepsBody, type NextStepsField } from "../nextSteps/NextSteps";
import { NEXT_STEPS_TYPE } from "../nextSteps/content";
import type { ScreeningResultsSnapshot } from "../screeningResults/screeningResults";
import { useScreeningResults } from "../screeningResults/useScreeningResults";
import "./printSummary.css";

export const PRINT_SUMMARY_TYPE = "print_summary";

/** A temporary, local-only print tree. It never receives the person's answers. */
export function PrintSummary() {
  const context = useContext(FormContext);
  const snapshot = useScreeningResults();
  const [error, setError] = useState("");
  const benefits = Object.entries(snapshot.results ?? {});
  const disabled =
    snapshot.mode === "editor" ||
    snapshot.pending ||
    snapshot.failed ||
    !benefits.length;

  const print = () => {
    // An answer edit can update the service before Preact repaints the button.
    const current: ScreeningResultsSnapshot | undefined = context
      .getService("screeningResults", false)
      ?.getSnapshot();
    if (
      !current ||
      current.mode === "editor" ||
      current.pending ||
      current.failed ||
      !Object.keys(current.results ?? {}).length ||
      document.querySelector(".bdt-print-root")
    )
      return;
    const benefits = Object.entries(current.results ?? {});
    setError("");
    const firstNextSteps = (fields: any[]): NextStepsField | undefined => {
      for (const field of fields) {
        if (field.type === NEXT_STEPS_TYPE) return field;
        const nested = firstNextSteps(field.components ?? []);
        if (nested) return nested;
      }
    };
    const source: NextStepsField =
      firstNextSteps(
        context.getService("formFieldRegistry").getForm()?.components ?? [],
      ) ?? {};
    const root = document.createElement("article");
    root.className = "bdt-print-root";
    const cleanup = () => {
      render(null, root);
      root.remove();
      document.body.classList.remove("bdt-printing");
      window.removeEventListener("afterprint", cleanup);
    };
    try {
      render(
        html`<${FormContext.Provider} value=${context}>
          <h1>${current.screenerName || "Benefit screening"}</h1>
          <p>
            ${new Date().toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <${NextStepsBody}
            field=${source}
            benefits=${benefits}
            complete=${benefits.every(([, benefit]) =>
              ["TRUE", "FALSE"].includes(benefit.result),
            )}
            pending=${false}
            failed=${false}
            mode="live"
            forPrint=${true}
          />
        <//>`,
        root,
      );
      // Printed links need their full destination. Use text nodes, never HTML.
      root
        .querySelectorAll<HTMLAnchorElement>(
          'a[href^="http:"] , a[href^="https:"]',
        )
        .forEach((link) => {
          const url = document.createElement("span");
          url.className = "bdt-print-url";
          url.textContent = ` (${link.href})`;
          link.after(url);
        });
      document.body.append(root);
      document.body.classList.add("bdt-printing");
      window.addEventListener("afterprint", cleanup);
      window.print();
    } catch {
      setError("Could not open printing. Please try again.");
    } finally {
      cleanup();
    }
  };

  return html`<div class="fjs-form-field bdt-print-summary">
    <button type="button" disabled=${disabled} onClick=${print}>
      Print / Save as PDF
    </button>
    <p>Includes results and next steps. Your answers are not included.</p>
    ${snapshot.mode === "editor" &&
    html`<p>Printing is available in Preview after screening.</p>`}
    ${error && html`<p role="alert">${error}</p>`}
  </div>`;
}

PrintSummary.config = {
  ...Text.config,
  type: PRINT_SUMMARY_TYPE,
  name: "Print summary",
  icon: iconsByType("button"),
  propertiesPanelEntries: [],
};
