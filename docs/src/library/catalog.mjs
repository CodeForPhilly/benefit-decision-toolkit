// Builds the library catalog (benefit and eligibility check references) from the committed
// OpenAPI snapshot of the library-api. See docs/adr/0001. Plain JavaScript so that both
// astro.config.mjs (sidebar) and the content loader can import it.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const SNAPSHOT_PATH = fileURLToPath(
  new URL("../../../library-api/openapi.snapshot.json", import.meta.url),
);

const API_PREFIX = "/api/v1/";

export function readSnapshot(path = SNAPSHOT_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Resolve a local `#/components/schemas/...` reference. */
function resolve(openapi, schema) {
  let current = schema;
  const seen = new Set();
  while (current && current.$ref) {
    if (seen.has(current.$ref)) return {};
    seen.add(current.$ref);
    const key = current.$ref.replace("#/components/schemas/", "");
    current = openapi.components?.schemas?.[key];
  }
  return current ?? {};
}

/** Leaf fields of a schema as dotted paths, e.g. `simpleChecks.livesInPennsylvania`. */
function leafFields(openapi, schema, prefix = "", depth = 0) {
  const node = resolve(openapi, schema);
  if (depth > 6) return [];
  if (node.type === "object" && node.properties) {
    return Object.entries(node.properties).flatMap(([name, child]) =>
      leafFields(openapi, child, prefix ? `${prefix}.${name}` : name, depth + 1),
    );
  }
  if (node.type === "array") {
    const items = resolve(openapi, node.items ?? {});
    if (items.type === "object" && items.properties) {
      return leafFields(openapi, items, `${prefix}[]`, depth + 1);
    }
    return [{ name: prefix, type: `list of ${items.type ?? "values"}` }];
  }
  const type = node.format === "date" ? "date" : (node.type ?? "value");
  return [{ name: prefix, type }];
}

function titleCase(identifier) {
  const words = identifier.replace(/[-_]/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "IncomeAtOrBelow150PercentFpl" -> "Income at or below 150 percent fpl" */
function humanize(name) {
  const words = name
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * One entry per benefit or eligibility check that publishes a reference (`x-bdt-reference`).
 * `slug` mirrors the endpoint path under `library/`, e.g. `library/benefits/pa/liheap-cash`.
 */
export function buildCatalog(openapi = readSnapshot()) {
  const operations = new Map();
  for (const [path, item] of Object.entries(openapi.paths ?? {})) {
    if (!path.startsWith(API_PREFIX) || !item.post) continue;
    operations.set(item.post.operationId, { path, operation: item.post });
  }

  const entries = [];
  for (const { path, operation } of operations.values()) {
    const reference = operation["x-bdt-reference"];
    if (!reference) continue;
    const resourcePath = path.slice(API_PREFIX.length);
    const segments = resourcePath.split("/");
    const kind = segments[0] === "benefits" ? "benefit" : "check";
    const slug = `library/${resourcePath}`;
    const body = operation.requestBody?.content?.["application/json"] ?? {};
    const requestSchema = resolve(openapi, body.schema ?? {});

    const examples = Object.entries(body.examples ?? {})
      .filter(([, example]) => example.description)
      .map(([name, example]) => ({
        name: example.summary ?? name,
        description: example.description,
        request: example.value,
        expected: example["x-bdt-expected"] ?? {},
      }));

    const checks = (reference.checks ?? []).map((check) => {
      const target = operations.get(check.operationId);
      const benefitCheck = (operation["x-bdt-benefit"]?.checks ?? []).find(
        (configured) => configured.alias === check.alias,
      );
      return {
        alias: check.alias,
        title: humanize(check.alias),
        rationale: check.rationale ?? null,
        parameters: benefitCheck?.parameters ?? {},
        parameterBindings: benefitCheck?.parameterBindings ?? {},
        checkTitle: target ? titleCase(target.path.split("/").at(-1)) : check.operationId,
        checkSlug:
          target && target.operation["x-bdt-reference"]
            ? `library/${target.path.slice(API_PREFIX.length)}`
            : null,
      };
    });

    entries.push({
      id: slug,
      slug,
      kind,
      title: titleCase(segments.at(-1)),
      endpoint: path,
      operationId: operation.operationId,
      category: kind === "benefit" ? benefitCategory(segments) : titleCase(segments[1]),
      summary: reference.summary,
      reference,
      checks,
      inputs: leafFields(openapi, requestSchema.properties?.situation ?? {}, "situation"),
      examples,
    });
  }
  return entries.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** benefits/pa/phl/loop -> "PA / PHL"; benefits/pa/liheap-cash -> "PA"; benefits/x -> "Federal" */
function benefitCategory(segments) {
  const places = segments.slice(1, -1);
  return places.length ? places.map((place) => place.toUpperCase()).join(" / ") : "Federal";
}

/** Starlight sidebar groups: benefits by place, checks by category. */
export function librarySidebar(entries = buildCatalog()) {
  const group = (kind) => {
    const byCategory = new Map();
    for (const entry of entries.filter((candidate) => candidate.kind === kind)) {
      if (!byCategory.has(entry.category)) byCategory.set(entry.category, []);
      byCategory.get(entry.category).push({ label: entry.title, link: `/${entry.slug}/` });
    }
    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, items]) => ({ label, items }));
  };
  return {
    label: "Library",
    items: [
      { label: "About the library", slug: "library" },
      { label: "Benefits", items: group("benefit") },
      { label: "Eligibility checks", items: group("check") },
    ],
  };
}
