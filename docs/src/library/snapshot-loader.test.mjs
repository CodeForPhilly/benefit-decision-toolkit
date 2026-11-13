import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { snapshotLoader } from "./snapshot-loader.mjs";

test("snapshot changes refresh references and remove stale entries", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "bdt-snapshot-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const snapshotPath = join(directory, "openapi.snapshot.json");
  const writeSnapshot = (references) => writeFile(snapshotPath, JSON.stringify({
    paths: Object.fromEntries(Object.entries(references).map(([name, summary]) => [
      `/api/v1/checks/${name}`,
      { post: { operationId: name, "x-bdt-reference": { summary } } },
    ])),
  }));
  const entries = new Map();
  const handlers = new Map();
  const watchedPaths = [];
  const context = {
    store: {
      clear: () => entries.clear(),
      set: ({ id, data }) => entries.set(id, data),
    },
    parseData: async ({ data }) => data,
    watcher: {
      add: (path) => watchedPaths.push(path),
      on: (event, handler) => handlers.set(event, handler),
    },
  };

  await writeSnapshot({ age: "Original summary", removed: "Old reference" });
  await snapshotLoader(snapshotPath).load(context);
  assert.deepEqual(watchedPaths, [snapshotPath]);
  assert.equal(entries.get("library/checks/age").summary, "Original summary");
  assert.equal(entries.size, 2);

  await writeSnapshot({ age: "Updated summary", added: "New reference" });
  await handlers.get("change")(join(directory, "unrelated.json"));
  assert.equal(entries.get("library/checks/age").summary, "Original summary");

  await handlers.get("change")(snapshotPath);
  assert.equal(entries.get("library/checks/age").summary, "Updated summary");
  assert.equal(entries.get("library/checks/added").summary, "New reference");
  assert.equal(entries.has("library/checks/removed"), false);
  assert.equal(entries.size, 2);

  // Production builds load the same data without a development watcher.
  entries.clear();
  await snapshotLoader(snapshotPath).load({ ...context, watcher: undefined });
  assert.equal(entries.get("library/checks/age").summary, "Updated summary");
  assert.equal(entries.size, 2);
});
