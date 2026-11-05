// Type-check src against a per-file baseline of known errors.
//
// The codebase predates type checking, so `tsc` reports errors in files nobody
// has touched. This fails only when a file has more errors than its baseline,
// so new code is checked without first fixing every old error. After fixing
// errors, run `npm run typecheck -- --update` to lower the baseline.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const baselinePath = `${root}typecheck-baseline.json`;
const update = process.argv.includes("--update");

let output;
try {
  output = execFileSync("node_modules/.bin/tsc", ["--noEmit", "-p", "."], {
    cwd: root,
    encoding: "utf8",
  });
} catch (error) {
  // tsc exits non-zero whenever it reports errors.
  if (typeof error.stdout !== "string") throw error;
  output = error.stdout;
}

// Group each error's lines (tsc continues a message on indented lines) by file.
const errors = new Map();
let current;
for (const line of output.split("\n")) {
  const located = line.match(/^(.+?)\(\d+,\d+\): error TS\d+/);
  const global = line.match(/^error TS\d+/);
  if (located || global) {
    const file = located ? located[1] : "(no file)";
    current = [line];
    errors.set(file, [...(errors.get(file) ?? []), current]);
  } else if (current && line.startsWith(" ")) {
    current.push(line);
  }
}

const counts = Object.fromEntries(
  [...errors].map(([file, list]) => [file, list.length]).sort(),
);
const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

if (update) {
  writeFileSync(baselinePath, `${JSON.stringify(counts, null, 2)}\n`);
  console.log(
    `Recorded ${total} known type errors in typecheck-baseline.json.`,
  );
  process.exit(0);
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, "utf8"))
  : {};
const worse = Object.keys(counts).filter(
  (file) => counts[file] > (baseline[file] ?? 0),
);
const better = Object.keys(baseline).filter(
  (file) => (counts[file] ?? 0) < baseline[file],
);

for (const file of worse) {
  console.error(
    `${file}: ${counts[file]} type errors, baseline allows ${baseline[file] ?? 0}`,
  );
  for (const lines of errors.get(file)) console.error(lines.join("\n"));
}
if (better.length > 0) {
  console.log(
    `Fewer type errors than the baseline in ${better.join(", ")}. ` +
      "Run `npm run typecheck -- --update` to lock in the improvement.",
  );
}
if (worse.length > 0) {
  console.error(
    "\nFix the new type errors above. Only lower the baseline, never raise it.",
  );
  process.exit(1);
}
console.log(
  `Type check passed: ${total} type errors, none beyond the baseline.`,
);
