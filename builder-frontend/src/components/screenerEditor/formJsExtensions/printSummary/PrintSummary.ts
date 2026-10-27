import { html } from "htm/preact";
import { render } from "preact";
import { useContext, useState } from "preact/hooks";
import { FormContext, iconsByType, Text } from "@bpmn-io/form-js-viewer";
import { NextStepsBody, type NextStepsField } from "../nextSteps/NextSteps";
import { NEXT_STEPS_TYPE, webLink } from "../nextSteps/content";
import type { ScreeningResultsService } from "../screeningResults/screeningResults";
import { useScreeningResults } from "../screeningResults/useScreeningResults";
import "./printSummary.css";

export const PRINT_SUMMARY_TYPE = "print_summary";

// Printing is page-wide, so at most one print tree exists at a time.
let endPrint: (() => void) | undefined;

const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/** What a printed link must add so a paper copy still works, if anything. */
function printedDestination(link: HTMLAnchorElement): string | undefined {
  // Nothing to add when the link text already shows the destination.
  if (["http:", "https:"].includes(link.protocol))
    return webLink(link.textContent?.trim()) === webLink(link.href)
      ? undefined
      : link.href;
  if (!["mailto:", "tel:"].includes(link.protocol)) return;
  // Print the address or number alone.
  const contact = decode(link.pathname);
  const shown =
    link.protocol === "tel:"
      ? (value: string) => value.replace(/[^+\d]/g, "")
      : (value: string) => value.trim().toLowerCase();
  return shown(link.textContent ?? "") === shown(contact) ? undefined : contact;
}

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
    const service: ScreeningResultsService | undefined = context.getService(
      "screeningResults",
      false,
    );
    // An answer edit can update the service before Preact repaints the button.
    const current = service?.getSnapshot();
    if (
      !service ||
      !current ||
      current.mode === "editor" ||
      current.pending ||
      current.failed ||
      !Object.keys(current.results ?? {}).length
    )
      return;
    // Some browsers never send afterprint; replace a print tree left behind.
    endPrint?.();
    const benefits = Object.entries(current.results ?? {});
    setError("");
    // Print what the person sees: skip Next steps hidden by a condition.
    const firstNextSteps = (fields: any[]): NextStepsField | undefined => {
      for (const field of fields) {
        if (
          field.type === NEXT_STEPS_TYPE &&
          service.isNextStepsFieldShown(field.id)
        )
          return field;
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
    const printMedia = window.matchMedia?.("print");
    const onPrintMediaChange = (event: MediaQueryListEvent) => {
      if (!event.matches) cleanup();
    };
    const cleanup = () => {
      render(null, root);
      root.remove();
      document.body.classList.remove("bdt-printing");
      window.removeEventListener("afterprint", cleanup);
      printMedia?.removeEventListener("change", onPrintMediaChange);
      if (endPrint === cleanup) endPrint = undefined;
    };
    try {
      render(
        html`<${FormContext.Provider} value=${context}>
          <h1>${service.getScreenerName() || "Benefit screening"}</h1>
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
      root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
        const destination = printedDestination(link);
        if (!destination) return;
        const url = document.createElement("span");
        url.className = "bdt-print-url";
        url.textContent = ` (${destination})`;
        link.after(url);
      });
      document.body.append(root);
      document.body.classList.add("bdt-printing");
      endPrint = cleanup;
      // Mobile browsers return from print() before taking the snapshot, so
      // keep the print tree until the browser reports that printing ended.
      window.addEventListener("afterprint", cleanup);
      printMedia?.addEventListener("change", onPrintMediaChange);
      window.print();
    } catch {
      cleanup();
      setError("Could not open printing. Please try again.");
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
  // Text's create would add placeholder text this field never shows.
  create: (options = {}) => ({ ...options }),
};
