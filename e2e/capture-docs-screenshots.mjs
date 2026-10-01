// Captures the user guide screenshots from the bundled example screener.
// Usage: node capture-docs-screenshots.mjs [screeners] [custom-checks]
import { captureCustomChecksGuide } from "./docs-screenshots/custom-checks-guide.mjs";
import { captureScreenerGuide } from "./docs-screenshots/screener-guide.mjs";
import { openSession } from "./docs-screenshots/session.mjs";

const guides = {
  screeners: captureScreenerGuide,
  "custom-checks": captureCustomChecksGuide,
};
const requested = process.argv.slice(2);
const unknown = requested.filter((name) => !(name in guides));
if (unknown.length > 0) {
  console.error(
    `Unknown guide: ${unknown.join(", ")}. Choose from: ${Object.keys(guides).join(", ")}`,
  );
  process.exit(2);
}

const session = await openSession();
try {
  for (const [name, capture] of Object.entries(guides)) {
    if (requested.length === 0 || requested.includes(name))
      await capture(session);
  }
  console.log(`Captured screenshots with local account ${session.email}`);
} finally {
  await session.close();
}
