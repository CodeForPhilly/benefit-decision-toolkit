import { buildCatalog, readSnapshot, SNAPSHOT_PATH } from "./catalog.mjs";

/** @returns {import("astro/loaders").Loader} */
export function snapshotLoader(snapshotPath = SNAPSHOT_PATH) {
  return {
    name: "library-openapi-snapshot",
    load: async ({ store, parseData, watcher }) => {
      const reload = async () => {
        const entries = buildCatalog(readSnapshot(snapshotPath));
        store.clear();
        for (const entry of entries) {
          store.set({ id: entry.id, data: await parseData({ id: entry.id, data: entry }) });
        }
      };
      await reload();
      watcher?.add(snapshotPath);
      watcher?.on("change", async (changedPath) => {
        if (changedPath === snapshotPath) await reload();
      });
    },
  };
}
