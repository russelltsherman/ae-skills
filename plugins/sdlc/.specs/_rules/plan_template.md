# Template: plan.md

A plan says how a change will be made: which files change, in what order, what could go wrong, and what proves it works. An agent writes it, and the operator accepts it before any code is edited. It is detailed enough that someone, or an agent, who never saw the planning session could implement the change from it alone.

```
.specs/<feature>/<YYYYMMDD-HHMM>-<change>/plan.md
```

Write `plan.md` only when the operator asks for it, and only when either:

- a corresponding `spec.md` exists and its `## Areas of concern` is `None.`, or
- `intent.md` says `spec: skipped` and it has no open questions.

Asking for it approves the spec, or the intent when the spec is skipped.

## Front matter

Flat `key: value` lines only, as in `intent.md`. Use only the keys below. The plan's other inputs are the documents in its change directory.

| Key | Required | Values |
|---|---|---|
| `agent` | yes | The agent that wrote the plan, e.g. `claude` |
| `operator` | yes | The person the agent aligned with |

No `status` or `approved_by` keys. The plan is approved when the operator asks for implementation to start. Never edit code under a plan until then. The first implementation commit records the approval with a trailer: `Plan-Approved-By: <operator>`.

## Body

The first line after the front matter is `# Plan: <title>`, using the same title as the intent.

Then these sections, in this order, with these exact headings. Write `None.` only in `## Risks`; every other section must have content.

| Section | Contents |
|---|---|
| `## Files that change` | One bullet per repo-relative path. Mark new files `(new)`, deleted files `(deleted)` and renamed files `(renamed from <old path>)`. A path ending in `/` covers everything under that directory. Leave out the change directory itself. |
| `## Order of work` | A numbered list of steps. Each step cites the requirement IDs it delivers, e.g. `(R1, R3)`. When the spec is skipped, it cites intent constraint IDs instead, e.g. `(C1)`. |
| `## Risks` | One bullet per risk: what could break and how the plan guards against it. When a spec exists, cite the requirement or design point a risk relates to, e.g. `(spec R2)`. |
| `## Proof` | The tests, checks and commands that show the change works, and which requirement IDs (or constraint IDs, when the spec is skipped) each one proves. Name test files and the commands that run them. |

## Rules

- **Keep `## Files that change` exact.** Edit no file the list does not cover unless `plan.md` is updated in the same commit. Use a directory path only when the change really spans it.
- **Every requirement is covered.** Each `R` ID in the spec, except withdrawn ones, appears in `## Order of work`, and in `## Proof`, backed by either an automated test or a manual check that is named. When the spec is skipped, the same applies to each `C` ID in the intent.
- **Keep the plan true.** When the implementation departs from the plan, update `plan.md` in the same commit as the code. Review checks the diff against it.
- **Bug fixes start with the failing test.** When the intent says `type: fix`, the first step in `## Order of work` adds a test that reproduces the bug. `## Proof` names that test.

## Example

```markdown
---
agent: claude
operator: M. Okafor
---
# Plan: notify patrons when a held book is ready

## Files that change
- holds/events.py
- notifier/ (new)
- accounts/settings.py
- accounts/templates/settings.html
- tests/test_notifier.py (new)
- tests/test_settings.py

## Order of work
1. Publish a hold-ready event from the holds service (R1).
2. Add the notifier: read the event and the patron's channel, then send the message (R1, R2, R3).
3. Add the notification setting to the account page (R4).

## Risks
- Sending twice if the event is redelivered. The notifier records each hold ID it has sent for.
- Wording may read as urgent (spec R2). Use the decided wording, "Kept for you until <date>".

## Proof
- tests/test_notifier.py: one test per channel, including `none` (R3); message fields (R2); duplicate events send once.
- tests/test_settings.py: the setting saves and is read back (R4).
- R1 timing: the notifier test asserts the send happens within one queue poll; `pytest` passes.
```
