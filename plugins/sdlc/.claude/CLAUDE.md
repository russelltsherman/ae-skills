# CLAUDE.md

This directory is the `sdlc` Claude Code plugin, published in the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`). It is also the plugin's first project: it is built with its own process. The root intent is `INTENT.md`; the work breakdown, decisions (D-numbers) and components (F-numbers) are in `ROADMAP.md`.

## Commands

- Check the harness: `make check`. It validates the plugin, runs `shellcheck`, lints every `intent.md`, `spec.md` and `plan.md` in `.specs/`, and runs the `bats` tests in `tests/`, with no model calls. Run it before calling any change done; a failed step means the change is not done.
- Run the skills' evals: `make evals` runs every `evals/<skill>/` that has a matching `skills/<skill>/`; `make evals SKILL=<skill>` runs one; `ARGS="…"` passes extra `claude plugin eval` options to every run, e.g. `make evals SKILL=intent ARGS="--runs 1"`. These are real, billed model runs, never part of `make check`. The operator trusts the plugin directory once by running `make evals` in a terminal and answering `y`; after that, Claude can run it.
- Try work in progress: `claude --plugin-dir .`. Never use an unreleased skill to write its own intent, spec or plan (INTENT.md C4).
- Tag a release: `claude plugin tag .` after bumping `version` in `.claude-plugin/plugin.json`.

## Planning documents

- Every change is planned in `.specs/<feature>/<YYYYMMDD-HHMM>-<change>/`. Before creating, finding or editing anything under `.specs/`, read the rule file for it: `.specs/_rules/naming.md`, `intent_template.md`, `spec_template.md`, `plan_template.md`.
- Never create the next document (spec, plan, code) unless the operator asks for it. Asking is the approval.
- Never settle an open question or concern with your own answer. Record only what the operator decided, marked `(operator decision, <YYYY-MM-DD>)` where the template says so.
- `.specs/_rules/` here is the canonical copy that `init` ships to projects (D3). Changes to it are changes under the feature `specs-rules`.
