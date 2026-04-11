---
title: Editing the Example Screener
description: How to edit the example screener using GitHub Codespaces and VS Code
---

This guide walks you through editing the example screener that new users receive when they create an account. Changes you make and push will be reflected for all future new accounts.

## Prerequisites

- A GitHub account with write access to the repository
- [VS Code](https://code.visualstudio.com/) installed on your computer
- The [GitHub Codespaces extension](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces) installed in VS Code

## Overview

The workflow is:

1. Create a Codespace from the `main` branch
2. Log in to the app with a fake account (which comes pre-loaded with the example screener)
3. Make your edits to the screener and/or custom checks
4. Run the save script to export your changes
5. Commit and push
6. Stop or delete the Codespace

## Step 1: Create a Codespace

1. Open VS Code on your computer
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Search for **Codespaces: Create New Codespace**
4. Select the **benefit-decision-toolkit** repository
5. Choose the **main** branch
6. Wait for the Codespace to spin up and start all services (~3-5 minutes)

### How to Know When It's Ready

The setup is complete when:

- The browser pops up the frontend application in a new tab (port 5173)

If the frontend doesn't open automatically, see the [Accessing the Application](/dev/testing-prs-with-codespaces/#accessing-the-application) section in the Codespaces testing guide.

## Step 2: Log In

1. In the app, click **Continue with Google**
2. In the Firebase Emulator auth popup, click **Add new account** to create a fake Google account
3. Click **Sign in with Google.com**

Your new account will automatically have a copy of the latest example screener loaded.

:::note
This is a test environment. No real Google account is used, and the data is isolated to your Codespace.
:::

## Step 3: Edit the Screener

Make your changes to the example screener using the builder UI. You can:

- Edit the form (add, remove, or modify fields)
- Edit benefits and their configurations
- Add or modify custom eligibility checks

## Step 4: Save Your Changes

When you're satisfied with your edits, run the save script to export the updated screener data from the Firebase emulator so it can be committed to the repository.

In the VS Code terminal, run:

```bash
bin/export-example-screener
```

This script exports Firestore and Storage data from the running emulators into `seed-data/example-screener/` in a portable JSON format. This is the data that gets loaded for new accounts, so committing it is what makes your changes take effect.

## Step 5: Commit and Push

In the VS Code terminal:

```bash
git add .
git commit -m "Update example screener"
git push
```

## Step 6: Clean Up the Codespace

When you're done, stop or delete the Codespace to free up resources:

- **Stop** (preserves state): In VS Code, open the Command Palette and search for **Codespaces: Stop Current Codespace**
- **Delete** (recommended): Go to [github.com/codespaces](https://github.com/codespaces), find your Codespace, click the three-dot menu, and select **Delete**

Deleting is recommended to save storage costs paid by Code for Philly.

## Verifying Your Changes (Optional)

To confirm that your changes will work for new users:

1. Before deleting your Codespace, create another fake Google account in the Firebase Emulator auth popup
2. Log in with the new account
3. Verify the example screener reflects your edits

## Troubleshooting

For general Codespace issues (app not loading, ports not showing, services crashing), see the [Troubleshooting](/dev/testing-prs-with-codespaces/#troubleshooting) section in the Codespaces testing guide.

### Emulator data loss

If the Firebase emulators don't shut down gracefully (e.g., due to a Codespace idle timeout), unsaved emulator data may be lost. Always run the save script **before** stepping away from the Codespace for an extended period.

### Codespace idle timeout

Codespaces will stop after a period of inactivity (default: 30 minutes). Interacting with the web app alone may not count as activity. If you're making a long editing session, occasionally interact with the VS Code terminal to keep the Codespace alive. You might also want to run the `bin/export-example-screener` script periodically to ensure you can pick up where you left off when restarting the Codespace later.

To increase the default idle timeout, go to [github.com/settings/codespaces](https://github.com/settings/codespaces) and change the **Default idle timeout** setting (maximum: 240 minutes).
