# CLAUDE.md

This directory is the `workflow` Claude Code plugin, published in the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`). The root intent is `INTENT.md`; the work breakdown, decisions (D-numbers) and components (F-numbers) are in `ROADMAP.md`.


## Commands

Run these in this directory (or with `make -C plugins/workflow <target>` from the repo root). None of them runs evals or calls a model.

- `make check`: the check-target. Runs all four checks below, even after one fails, and ends with `check: all passed` or `check: failed: <checks>`.
- `make validate`: `claude plugin validate --strict .` and `claude plugin validate --profile directory .`.
- `make shellcheck`: `shellcheck` on every `.sh` file, except under `results/` and `*-workspace/` folders.
- `make lint-readmes`: each skill's `docs/skills/<skill>/README.md` against `docs/skills/README_TEMPLATE.md` and its eval cases.
- `make lint-evals`: each eval case folder in `evals/<skill>/<case>/`.
- `bash tests/lints.sh`: tests for the two lints.

`make check` is expected to fail until the Phase 1 work in `ROADMAP.md` is done (missing READMEs, missing `discuss` cases, and goal lines not yet in the `Checks that ` form).
