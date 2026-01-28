# Testing Pull Requests with GitHub Codespaces

This guide walks you through testing new features and bug fixes from pull requests using GitHub Codespaces. No technical setup required—everything runs in your browser.

## What is Codespaces?

GitHub Codespaces is a cloud-based development environment. Think of it as a complete computer running in your browser that's already set up with everything needed to run the application. When you start a Codespace, GitHub automatically:

- Creates a virtual machine in the cloud
- Installs all the required software
- Starts the application for you

This means you can test changes without installing anything on your own computer.

## What You'll Need

- A GitHub account (free to create at [github.com](https://github.com))
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- About 5-10 minutes for first-time setup

## Step-by-Step: Starting a Codespace from a Pull Request

### Step 1: Navigate to the Pull Request

1. Go to the Benefit Decision Toolkit repository on GitHub
2. Click on the **Pull requests** tab near the top of the page (next to "Issues" and "Actions")
3. Find and click on the pull request you want to test

You should now see the pull request page with a title, description, and various tabs like "Conversation", "Commits", and "Files changed".

### Step 2: Open the Code Menu

1. Look for a green button labeled **Code** on the right side of the page
   - This button is typically located above the file list or in the pull request header area
2. Click the **Code** button
3. A dropdown menu will appear with two tabs: **Local** and **Codespaces**

### Step 3: Create the Codespace

1. Click on the **Codespaces** tab in the dropdown
2. You'll see a button that says **Create codespace on [branch-name]**
   - The branch name will match the pull request's branch (shown in the dropdown)
3. Click that button

A new browser tab will open and begin setting up your Codespace.

## Waiting for Setup

After clicking to create your Codespace, you'll see a loading screen. Here's what to expect:

### What You'll See

1. **Initial loading**: A dark screen with "Setting up your codespace" message
2. **Building**: Progress messages about building the development environment
3. **Starting services**: The environment installs dependencies and starts the application

### How Long Does It Take?

- **First time**: 3-5 minutes (the environment needs to be built from scratch)
- **Subsequent times**: 1-2 minutes (if you've used this Codespace before)

### How to Know When It's Ready

The setup is complete when:

1. You see an interface that looks like VS Code (a code editor) in your browser
2. A terminal panel appears at the bottom of the screen
3. The terminal shows services starting up with colored status indicators
4. The browser pops up the frontend application in a new tab

## Accessing the Application

Once the Codespace is ready and services are running, you can access the application:

### Step 0: You Might Already Be There

If all went well during setup and you waited patiently for everything to spin up, then the
browser should have automatically opened the frontend application.

If the frontend didn't pop up for whatever reason, then proceed to step 1.

### Step 1: Find the Ports Panel

1. Look at the bottom of the VS Code interface
2. Find the tab labeled **Ports** (next to "Terminal" and "Problems")
3. Click on **Ports** to open the ports panel

### Step 2: Open the Application

1. In the Ports panel, find the row showing port **5173** (this is the Frontend)
   - You'll see columns for Port, Local Address, and Running Process
2. Look for a small globe icon in that row
   - Hovering over it may show "Open in Browser"
3. Click the globe icon

A new browser tab will open with the application.

Note: this will only work if there is already a Running Process listed for port 5173 (be patient).

#### Alternative Method

If you don't see the globe icon:
1. Right-click on the port 5173 row
2. Select **Open in Browser** from the context menu

### What URL to Expect

The URL will look something like:
```
https://[random-name]-5173.app.github.dev
```

This is your personal test instance of the application.

### Browser Popup Blockers

If clicking the globe icon doesn't open a new tab:
1. Check if your browser blocked a popup
2. Look for a popup blocker notification in your browser's address bar
3. Allow popups from `github.dev` domains

## Logging In to the Application

The application uses a test authentication system, so you don't need any real accounts.

1. On the application's login page, click the **Continue with Google**
2. A simple login window will pop-up (this is the Firebase Emulator, not real Google Firebase authentication)
3. You can either:
   - Click **Add new account** to create a fake google account
   - If you've logged in previously with this codespace, pick an existing fake google account
4. Click **Sign in with Google.com**.

### Important Notes

- This is a **test environment**—no real Google account is used
- Any data you create is **isolated to this Codespace**
- Your test data won't affect anyone else and will be deleted when the Codespace is deleted

## Testing the Feature

Now you're ready to test! Here are some tips:

1. **Review the pull request description** for specific things to test
2. **Try the new feature** as described in the pull request
3. **Test edge cases** (unusual inputs, empty fields, etc.)
4. **Check for visual issues** (layout problems, missing text, etc.)
5. **Document any issues** you find by commenting on the pull request

## When You're Done Testing

### Simply Close the Tab

When you're finished testing, you can simply close the browser tab. The Codespace will automatically stop (shutdown) after 30 minutes of inactivity. The Codespace will remain available to start again for 30 days (by default).

### Deleting the Codespace (Recommended when done testing)

Deleting a Codespace will delete all data you've created during testing. You'll want to do this to save storage costs paid by Code for Philly.

To clean up:

1. Go to [github.com/codespaces](https://github.com/codespaces)
2. Find your Codespace in the list on the left and click to select it
3. Click the three dots menu on the right side
4. Select **Delete**

## Troubleshooting

### "Application not loading"

**Symptoms**: The browser shows a blank page or error after clicking the globe icon

**Solutions**:
1. Wait a minute longer—services may still be starting
2. Check the Terminal panel for error messages
3. Try refreshing the application page
4. In the terminal, type `devbox services list` and press Enter to see a summary of which services are running (or not)
5. In the terminal, type `devbox services attach` and press Enter to show the logs of the running services and look for errors

### "Port not showing in the Ports panel"

**Symptoms**: The Ports panel is empty or doesn't show port 5173

**Solutions**:
1. Click the refresh icon in the Ports panel header
2. Wait for services to fully start (check the Terminal for progress)
3. In the terminal, type `devbox services up` and press Enter
4. In the terminal, type `devbox services attach` and press Enter to show the logs of the running services and look for errors

### "Services crashed or stopped"

**Symptoms**: The terminal shows errors or services have stopped

**Solutions**:
1. In the terminal at the bottom of VS Code, type:
   ```
   devbox services up
   ```
2. Press Enter
3. Wait for services to restart (you'll see status messages)

### "Codespace won't start"

**Symptoms**: Stuck on loading screen for more than 10 minutes

**Solutions**:
1. Close the tab and try again
2. Go to [github.com/codespaces](https://github.com/codespaces)
3. Delete the stuck Codespace
4. Create a new one from the pull request

### "I need to test a different pull request"

Each pull request needs its own Codespace. You can either:
1. Delete your current Codespace and create a new one for the other PR
2. Keep multiple Codespaces running (note: this uses more of your free tier hours)

## Need More Help?

If you're stuck:
1. Ask in the pull request comments
2. Reach out to the development team
3. Check the [project's main README](../README.md) for additional resources
