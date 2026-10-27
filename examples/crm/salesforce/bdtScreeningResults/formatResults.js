import { safeHttpUrl } from "c/bdtCrmHost";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function outcome(value, check = false) {
  if (value === "TRUE")
    return {
      label: check ? "Passed" : "Eligible",
      className: "outcome outcome_pass",
    };
  if (value === "FALSE")
    return {
      label: check ? "Not met" : "Ineligible",
      className: "outcome outcome_fail",
    };
  return {
    label: check ? "Unknown" : "Needs information",
    className: "outcome outcome_unknown",
  };
}

function checkName(check) {
  const name = check.aliasName || check.name;
  if (typeof name !== "string") return "Unnamed check";
  return name
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim();
}

function markdownText(value) {
  return isObject(value) &&
    value.format === "markdown" &&
    typeof value.text === "string"
    ? value.text
    : "";
}
function nextStepsView(steps, result) {
  if (
    !isObject(steps) ||
    (result !== "TRUE" && result !== "FALSE") ||
    steps.status !== (result === "TRUE" ? "eligible" : "ineligible")
  )
    return {};
  const eligible = result === "TRUE";
  const applyUrl = eligible ? safeHttpUrl(steps.applyUrl) : null;
  const helpUrl = eligible ? safeHttpUrl(steps.help?.url) : null;
  const phone =
    eligible && typeof steps.help?.phone === "string" ? steps.help.phone : "";
  const body = eligible ? markdownText(steps.body) : "";
  const note = eligible ? "" : markdownText(steps.note);
  const unmetRequirements =
    !eligible && Array.isArray(steps.unmetRequirements)
      ? steps.unmetRequirements
          .filter((item) => typeof item === "string")
          .map((name, index) => ({ id: String(index), name }))
      : [];
  return {
    hasNextSteps: !!(
      applyUrl ||
      helpUrl ||
      phone ||
      body ||
      note ||
      unmetRequirements.length
    ),
    hasUnmetRequirements: unmetRequirements.length > 0,
    applyUrl,
    helpUrl,
    phone,
    body,
    note,
    unmetRequirements,
  };
}

export function formatSavedResults(raw) {
  const snapshot = JSON.parse(raw);
  if (!isObject(snapshot) || !isObject(snapshot.results))
    throw new Error("Invalid saved screening snapshot");

  const counts = { eligible: 0, ineligible: 0, unknown: 0 };
  const benefits = Object.entries(snapshot.results).map(([id, benefit]) => {
    if (!isObject(benefit)) throw new Error("Invalid saved benefit result");
    counts[
      benefit.result === "TRUE"
        ? "eligible"
        : benefit.result === "FALSE"
          ? "ineligible"
          : "unknown"
    ]++;
    const checks = isObject(benefit.check_results)
      ? Object.entries(benefit.check_results).map(([checkId, check]) => {
          if (!isObject(check)) throw new Error("Invalid saved check result");
          const status = outcome(check.result, true);
          return {
            id: checkId,
            name: checkName(check),
            status: status.label,
            statusClass: status.className,
          };
        })
      : [];
    const status = outcome(benefit.result);
    return {
      id,
      name: typeof benefit.name === "string" ? benefit.name : "Unnamed benefit",
      status: status.label,
      statusClass: status.className,
      checks,
      hasChecks: checks.length > 0,
      checksLabel: `View checks (${checks.length})`,
      ...nextStepsView(snapshot.nextSteps?.[id], benefit.result),
    };
  });
  const timestamp =
    typeof snapshot.evaluatedAt === "string"
      ? Date.parse(snapshot.evaluatedAt)
      : NaN;
  return {
    benefits,
    hasBenefits: benefits.length > 0,
    evaluatedAt: Number.isFinite(timestamp)
      ? new Date(timestamp).toISOString()
      : null,
    screenerId:
      typeof snapshot.screenerId === "string" ? snapshot.screenerId : "",
    ...counts,
  };
}
