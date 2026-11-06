---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: Create eval-target

## Problem
Nothing runs the skills' eval cases in one step. Today, running them means typing a `claude plugin eval` command per skill and remembering which options each run needs. Nothing runs every skill's cases together, and nothing reports which skills passed and which failed.

`ROADMAP.md` makes this F6, built by hand in Phase 0, with its shape proposed in D11. It comes before Phase 1 because every skill is built under `policy-skill-authoring` (D5), whose eval loop runs on it. It sits beside `check-target/20261105-1022-create`, which never runs evals (INTENT.md constraint 12).

## Proposed outcome
One command, `make evals`, run from the plugin directory, that runs the eval cases of every skill, or of one skill with `make evals SKILL=<skill>`, prints a summary line naming the skills that passed and failed, and exits non-zero when any skill failed.

## Affected users and systems
- Users: the operator developing the `sdlc` plugin; Claude, which runs a skill's evals while building or changing it.
- Systems: the plugin's `Makefile` (from the check-target), eval cases in `evals/<skill>/` at the plugin root, `claude plugin eval`, the operator's Claude account (billed model runs), `.gitignore`, `.claude/CLAUDE.md`.

## Constraints
- C1. The command is `make evals`, run from the plugin directory. `make evals SKILL=<skill>` runs one skill.
- C2. Each skill's cases live in `evals/<skill>/` at the plugin root, and each skill runs as `claude plugin eval --eval-dir evals/<skill> .`.
- C3. Extra `claude plugin eval` options are passed through `ARGS`, e.g. `make evals SKILL=intent ARGS="--runs 1"`.
- C4. Every selected skill runs even after one fails; a summary line at the end names the skills that passed and failed, and the command exits non-zero when any failed.
- C5. `make check` never runs evals, and `make evals` does not run `make check`.
- C6. Scripts are Bash and `jq`, with Python stdlib only where Bash gets unreadable (D7).
- C7. The command is listed in `.claude/CLAUDE.md`.
- C8. A bare `make evals` runs every directory `evals/<name>/` that has a matching `skills/<name>/`. A directory under `evals/` with no matching skill, such as `evals/results/`, is not run; its name is listed in the output, and it does not change the exit status. A skill with no directory under `evals/` is not run and is not reported.
- C9. `make evals SKILL=<skill>` with no `evals/<skill>/` directory fails with a non-zero exit, naming the missing directory and listing the skills that have one.
- C10. Every run passes `--no-publish`; reports stay local.
- C11. Every run passes `--scaffold`. Runs do not pass `--trust-plugin`, so the tool's first-run trust prompt still asks.
- C12. Every run keeps the tool's default no-plugin baseline arm, except for a command-only skill (`disable-model-invocation: true` in its `SKILL.md` front matter), which runs with `--ablation none`.
- C13. No default spending cap and no default runs per case: the tool's defaults apply unless set through `ARGS`.
- C14. Runs use the operator's own Claude config; no separate config directory is set up.
- C15. `evals/*/results/` is ignored by `.gitignore`; results are not committed.
- C16. Only `claude plugin eval` is used. The fallback named in D11 (the playbook's JSON format, run with `claude -p --plugin-dir`) is not part of this change.
- C17. The operator trusts the plugin directory once by running `make evals` in a terminal; after that, Claude can run it. When a run fails because the directory is not trusted, `make evals` says to run it once in a terminal.
- C18. A skill fails when its `claude plugin eval` run exits non-zero, whatever the reason: a case below `--threshold`, the cost cap hit, or any error.
- C19. An `evals/<skill>/` directory with no eval cases is run like any other, and its non-zero exit makes the skill fail.
- C20. `make evals SKILL=<name>` runs `evals/<name>/` whenever that directory exists, whether or not `skills/<name>/` does.

## Open questions
None.

## Action already taken
None.
