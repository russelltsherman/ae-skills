---
agent: claude
operator: Russell Sherman
origin: person
type: chore
risk: routine
spec: required
---
# Intent: Create eval-target

## Problem
There is no one command that runs the `workflow` plugin's evals. Running a skill's cases means typing `claude plugin eval --eval-dir evals/<skill> .` by hand, once per skill, and remembering the options that make the results mean something. The CLI's defaults don't fit these cases:
- Its setup scripts run only with `--scaffold`. The skills that write files into a project, such as `init` and `handoff`, will need cases with setup scripts.
- It adds a no-plugin baseline run to every case, which is meaningless for a command-only skill and doubles the cost.
- It publishes the report to claude.ai unless told not to.
- It grants Bash, Write and Edit only through `--allow-tools`.

Without these options, a run can report failures that come from the setup, not from the skill.

This is roadmap component F6, under decision D4 in `ROADMAP.md`, and root intent constraint 7 in `INTENT.md`. It sits beside `make check` from `check-target/20261105-1153-create`, which never runs evals.

## Proposed outcome
One command, `make evals`, run in the plugin directory, runs every skill's eval cases with the right options, or one skill's cases when one is named. It runs every skill even after one fails, ends with a summary line, and exits non-zero when any skill fails. The report stays on the machine.

## Affected users and systems
- Users: the author, when checking a skill's behavior with real model runs.
- Systems: the plugin directory `plugins/workflow/` (a new `make evals` target and the script it runs), `claude plugin eval`, `jq`, the eval cases in `evals/`, and the skills' `SKILL.md` front matter. Runs are billed against the author's plan or API account.

## Constraints
- C1. `make evals`, run in the plugin directory, runs the eval cases of every skill in `skills/`, one `claude plugin eval --eval-dir evals/<skill> .` run per skill.
- C2. `make evals SKILL=<skill>` runs only that skill's cases.
- C3. Every run passes `--scaffold`.
- C4. A command-only skill (`disable-model-invocation: true` in its `SKILL.md` front matter) runs with no baseline arm. Any other skill keeps the CLI's default baseline arm.
- C5. Every run passes `--no-publish`; the report is not published to claude.ai.
- C6. `--trust-plugin` is not passed; the author answers the CLI's first-run trust prompt by hand.
- C7. `make evals` runs every selected skill even when an earlier one fails, ends with a summary line, and exits non-zero when any skill failed.
- C8. A skill with no eval cases in `evals/<skill>/` counts as a failure.
- C9. Extra `claude plugin eval` options are passed through `ARGS`, for example `make evals ARGS="--runs 1"`.
- C10. No cost limit is set by default.
- C11. `make evals` sets up no isolation of its own (no `CLAUDE_CONFIG_DIR`, no token) and runs on the author's normal login. `claude plugin eval` already runs each case with a temporary home and configuration, without the author's settings, hooks, `CLAUDE.md`, memory, plugins or MCP servers (https://code.claude.com/docs/en/plugin-evals.md#how-runs-are-isolated).
- C12. A skill's tool grants are listed in a file next to its cases, `evals/<skill>/allow-tools`, and `make evals` passes them to that skill's run as `--allow-tools`. A case's `allowed_tools` cannot grant Bash, Write, Edit, WebFetch or WebSearch (https://code.claude.com/docs/en/plugin-evals.md#grant-tools).
- C13. The `allow-tools` file is not an eval case, and `make check` passes with it present.
- C14. `make check` does not run `make evals` (root intent constraint 7).
- C15. Scripts are Bash and `jq`, with Python stdlib only where Bash gets unreadable.

## Open questions
None.

## Action already taken
None.
