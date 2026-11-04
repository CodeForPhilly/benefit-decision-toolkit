# Issue tracker: GitHub

Issues and specs live in CodeForPhilly/benefit-decision-toolkit.
Use the `gh` CLI from this checkout.

## Operations

- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open`, with relevant label filters.
- Create: `gh issue create --title "..." --body-file <file>`.
- Comment: `gh issue comment <number> --body-file <file>`.
- Label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close: post the explanation as a comment, then run `gh issue close <number>`.

Use files with actual newlines for multiline bodies and comments.

Before the first issue creation in a session, verify the target with
`gh repo view --json nameWithOwner`. The expected repository is
`CodeForPhilly/benefit-decision-toolkit`; resolve any mismatch before writing.

## Relationships

Use native GitHub sub-issues and issue dependencies when supported.
Otherwise, put `Part of #<parent>` and `Blocked by: #<number>` at the top
of the child issue body and link children in the parent's task list.
A ticket is unblocked when every blocker is closed.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Skill terminology

“Publish to the issue tracker” means create a GitHub issue.
“Fetch the relevant ticket” means read the GitHub issue.
