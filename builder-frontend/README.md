## Usage

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory you can run:

### `npm run dev`

Runs the app in the development mode.<br>
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

Learn more about deploying your application with the [documentations](https://vite.dev/guide/static-deploy.html)

## App navigation

The authenticated editor uses three consistent navigation levels:

- **App areas:** Screeners and Custom Checks sit beside the logo in the
  compact header. The active area stays highlighted on its list and detail pages. The logo links to `/screeners`.
  `/` and the legacy `/projects` URLs redirect to `/screeners`; legacy `/check`
  URLs redirect to `/custom-checks`, preserving detail IDs, query strings, and hashes.
- **Parent pages:** Breadcrumbs in the editor bar link back to each detail editor’s own
  list and show the current screener or check name. Benefit configuration has a
  breadcrumb back to Manage Benefits within the open screener. Parent navigation
  uses a known destination, so it also works when a detail page is opened directly.
- **Editor sections:** The section buttons share the editor bar with the
  breadcrumb, with the current section highlighted. On narrow screens, the
  breadcrumb gets one line and the section buttons scroll horizontally. Long
  names truncate visually, with the full name available on hover and to screen
  readers. Section and benefit selection remain
  local editor state rather than separate URLs.

The account menu contains User Guide, Logout, and the development-only example
export. Published `/screener/:publishedScreenerId` pages remain outside the editor
navigation.

## Screener sharing

The Screeners page offers **Import screener**. Each screener card's menu offers
**Export screener**, which downloads the saved draft as a single `.bdt.json` file.
The import dialog prefills the exported screener name and requires a different name if it already exists in the account. Creation, rename, and import enforce per-user name uniqueness, ignoring case and surrounding spaces.

Import creates a new unpublished screener for the
signed-in user. Files contain a `bdt-screener` format marker and `formatVersion: 1`.
Exports include only the custom-check versions the benefits reference, never the
author's unpublished draft; a new family's draft is seeded from its latest included
version. Custom checks retain an `originCheckId` across imports and later exports. Existing
families and matching published versions are reused; missing versions are added,
and recipient draft edits are preserved. Conflicting published content (or a
referenced draft that differs) returns a readable 409 error. Unrelated checks
with the same name remain separate and receive an `imported` module suffix.
Older exports without `originCheckId` use their original working family ID.
Imported DMN models must compile as they would on publish, and each check's input
definition is derived from its model rather than taken from the file.
Library check references are resolved against the receiving server's library.
