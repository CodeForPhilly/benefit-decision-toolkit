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

- **App areas:** Projects and Eligibility checks sit beside the logo in the
  compact header. The active area stays highlighted on its list and detail pages. `/`
  remains a Projects list alias, and the logo links to `/projects`.
- **Parent pages:** Breadcrumbs in the editor bar link back to each detail editor’s own
  list and show the current project or check name. Benefit configuration has a
  breadcrumb back to Manage Benefits within the open project. Parent navigation
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
