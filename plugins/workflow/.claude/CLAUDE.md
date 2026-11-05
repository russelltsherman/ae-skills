# CLAUDE.md

This directory is the `workflow` Claude Code plugin, published in the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`). The root intent is `INTENT.md`; the work breakdown, decisions (D-numbers) and components (F-numbers) are in `ROADMAP.md`.

## Checks

Run from this directory. None of these make model calls.

- `make check` — run every check below, even after a failure, then print a summary line
- `make validate` — `claude plugin validate --strict .` and `claude plugin validate --profile directory .`
- `make shellcheck` — shellcheck every `.sh` file (skips `.specs/`, `results/`, `*-workspace/`)
- `make lint-readmes` — each skill has `docs/skills/<skill>/README.md` matching `docs/skills/README_TEMPLATE.md` and its eval cases
- `make lint-evals` — each skill has eval cases under `evals/<skill>/`, each with a goal line, matching name, `prompt.md`, graders and its context files
- `bash tests/lints.sh` — tests for the two lint scripts

## Planning

Before creating, finding or editing anything under `.specs/`, read `.specs/CLAUDE.md` and the rule file it names.
