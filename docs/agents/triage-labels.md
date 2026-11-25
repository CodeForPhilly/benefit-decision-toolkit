# Triage labels

| Canonical role | Tracker label | Meaning |
| --- | --- | --- |
| needs-triage | needs-triage | Maintainer needs to evaluate |
| needs-info | needs-info | Waiting on reporter information |
| ready-for-agent | ready-for-agent | Fully specified for agent implementation |
| ready-for-human | ready-for-human | Requires human implementation |
| wontfix | wontfix | Will not be actioned |

When a skill names a triage role, apply the corresponding tracker label.

## Category roles

Category roles use GitHub's native issue **Type** field, not labels.

| Canonical role | Issue type | Meaning |
| --- | --- | --- |
| bug | Bug | Something is broken |
| enhancement | Feature | New feature or improvement |

The repository also defines a `Task` type for internal work items; triage
does not assign it, but treat an issue already typed `Task` as categorised.
