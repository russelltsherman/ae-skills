# CLAUDE.md

This directory is the `workflow` Claude Code plugin, published in the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`). The root intent is `INTENT.md`; the work breakdown, decisions (D-numbers) and components (F-numbers) are in `ROADMAP.md`.

## Checks

Run from this directory. None of these make model calls.

- `make check` — run every check below, even after a failure, then print a summary line
- `make validate` — `claude plugin validate --strict .` and `claude plugin validate --profile directory .`
- `make shellcheck` — shellcheck every `.sh` file (skips `.specs/`, `results/`, `*-workspace/`)
- `make lint-readmes` — each skill has `docs/skills/<skill>/README.md` matching `docs/skills/README_TEMPLATE.md` and its eval cases
- `make lint-evals` — each skill has eval cases under `evals/<skill>/`, each with a goal line, matching name, `prompt.md`, graders and its context files
- `make tests` — run every `tests/*.sh`: the tests for the two lint scripts and for `skills/init/init.sh`

## Evals

Run from this directory. Evals are billed model runs; `make check` never runs them.

- `make evals` — run every skill's eval cases, one `claude plugin eval` run per skill, then print a summary line
- `make evals SKILL=<skill>` — run one skill's eval cases
- `make evals ARGS="..."` — pass extra `claude plugin eval` options to every run, e.g. `ARGS="--runs 1"`; tool grants go in `evals/<skill>/allow-tools`, one per line

## Planning

Before creating, finding or editing anything under `.specs/`, read `.specs/CLAUDE.md` and the rule file it names.
