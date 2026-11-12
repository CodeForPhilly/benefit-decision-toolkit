# Benefit and eligibility check references are authored in DMN and published through a committed OpenAPI snapshot

Benefit references and eligibility check references are written inside each library DMN file: the model and decision descriptions, a constant `reference` decision, and text annotations. Worked examples come from Bruno tests that have a `docs` block. The library-api exposes all of this in its OpenAPI document, and a Java test keeps a committed snapshot of that document up to date. Every place that shows a reference reads that one contract: the builder (through the library metadata loader), the docs site (from the snapshot at build time), and Swagger UI. We chose this so a reference sits next to the rules it explains and can be checked at startup. Because the docs site reads a file rather than a running service, it never needs Java or the library-api to build.

## Considered Options

- **A separate catalog JSON file generated at build time.** Rejected because it would be a second contract that has to stay in step with OpenAPI, which the builder already consumes.
- **Each place parses the DMN itself.** Rejected because DMN extraction logic would be duplicated in Java, Python and the docs site's JavaScript.
- **Hand-written docs pages.** Rejected because they drift from the rules they describe.

## Consequences

- Any change to a reference or example changes the snapshot, so it shows up as a reviewable diff, and a stale snapshot fails `mvn test`.
- Reference fields are plain text, because the builder has no Markdown renderer and OpenAPI clients would see raw markup.
