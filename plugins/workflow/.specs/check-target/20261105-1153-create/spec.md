---
agent: claude
operator: Russell Sherman
skills: none
---
# Spec: Create check-target

## Requirements
- R1. A `Makefile` at the plugin root has the targets `check`, `validate`, `shellcheck`, `lint-readmes` and `lint-evals`. `check` runs the other four; each of the others runs one check on its own (operator decision, 2026-11-05).
- R2. The scripts the targets run live in `scripts/` at the plugin root (operator decision, 2026-11-05). They are Bash and `jq`, with Python stdlib only where Bash gets unreadable.
- R3. Before a check runs, the tools it needs are looked up: `claude` for `validate`, `shellcheck` for `shellcheck`, and `jq` for every target. A missing tool fails that check with a message naming the tool. `make check` reports every missing tool, not just the first.
- R4. `validate` runs `claude plugin validate --strict .` and `claude plugin validate --profile directory .` in the plugin directory and fails when either exits non-zero. Their own output is shown unchanged (operator decision, 2026-11-05).
- R5. `shellcheck` runs `shellcheck` on every `.sh` file in the plugin directory, except files under a folder named `results` or a folder whose name ends in `-workspace`. It uses `shellcheck`'s defaults: all severities, no `.shellcheckrc` from this or any parent folder, no excluded codes (operator decision, 2026-11-05).
- R6. A skill is a folder in `skills/` that holds a `SKILL.md`; its name is the folder name. A case of a skill is a direct subfolder of `evals/<skill>/` other than `results/` (operator decision, 2026-11-05).
- R7. `lint-readmes` fails for each skill without a file at `docs/skills/<skill>/README.md`.
- R8. `lint-readmes` fails a README whose first line is not `# <skill>`.
- R9. `lint-readmes` fails a README with no Markdown link whose target is `../../../skills/<skill>/SKILL.md`.
- R10. `lint-readmes` checks a README's headings, ignoring every line inside a fenced code block. Its `##` headings are exactly the `##` headings of the template in `docs/skills/README_TEMPLATE.md`, with the same names and in the same order, where only `Details` and `Limits` may be missing. No other `##` heading is allowed. Headings of level `###` or deeper are allowed only under `## Details` (operator decision, 2026-11-05).
- R11. `lint-readmes` checks the table under `## Test cases`. Its rows list each case of the skill (R6) exactly once, in any order, as `` `<case>` `` in the first cell, with no row for anything that is not a case. Each row's second cell equals line 1 of that case's `case.yaml` without the `# Goal: ` prefix (operator decision, 2026-11-05).
- R12. `lint-evals` fails each skill (R6) with no cases in `evals/<skill>/`, and each folder in `evals/` that is not the name of a skill.
- R13. `lint-evals` checks each case folder: line 1 of `case.yaml` starts with `# Goal: Checks that` (operator decision, 2026-11-05); its top-level `name:` equals the folder name; `prompt.md` exists; `graders/` holds at least one `.md` file; and every file named under `context:` in `case.yaml` exists in the case folder.
- R14. Each check prints a header line naming it. Each problem it finds is one line, `<path>: <problem>`, with `<path>` relative to the plugin directory. A check fails when it finds at least one problem (operator decision, 2026-11-05).
- R15. `make check` runs all four checks even when an earlier one fails, ends with a summary line naming the checks that failed (or saying all passed), and exits non-zero when any check failed.
- R16. No target runs evals, calls a model, or reads anything under `.specs/`.

## Design
- **Files (R1, R2).**
  - `Makefile`: each target runs one script. All targets are `.PHONY`.
  - `scripts/check.sh`: runs the four check scripts in order, records which failed, prints the summary and sets the exit status (R15). `make check` runs this script rather than listing the four targets as prerequisites, because make stops at the first failing prerequisite unless run with `-k`.
  - `scripts/validate.sh`, `scripts/shellcheck.sh`, `scripts/lint-readmes.sh`, `scripts/lint-evals.sh`: one per check.
  - `scripts/lib.sh`: shared helpers sourced by the others: the plugin root, the header and problem-line format (R14), the tool lookup (R3), and the skill and case lists (R6).
  Every script works out the plugin root from its own location, so it runs the same from any working directory.
- **Tool lookup (R3).** `command -v` for each tool a script needs. A missing tool is reported as a problem line (`claude: not installed`) and the script exits non-zero without running its check. `check.sh` runs every script regardless, so every missing tool is reported.
- **validate (R4).** Runs both commands in turn, passing their output straight through, and fails if either exit status is non-zero. The missing-icon warning does not fail either command today, and nothing here changes that.
- **shellcheck (R5).** `find . -name '*.sh'` pruning `results` and `*-workspace` folders, then `shellcheck --norc` on the list. `--norc` stops `shellcheck` reading a `.shellcheckrc` from this or any parent folder. `shellcheck`'s own output is shown; the check fails when it exits non-zero.
- **Skills and cases (R6).** Skills: `skills/*/SKILL.md`, taking the folder names; `skills/*-workspace/` has no `SKILL.md` and drops out. Cases: `evals/<skill>/*/` minus `results/`. Both lists are sorted so output is stable.
- **README headings (R10).** The template's `##` headings are read at run time from the fenced block under `## Template` in `README_TEMPLATE.md`, so the lint and the template cannot drift. Which headings may be missing (`Details`, `Limits`) is written into the lint. A line is a heading when it starts with `#`s and a space, outside a fenced block; a fence is a line starting with three backticks or tildes. The README's `##` headings are compared in order to the template's, skipping a missing `Details` or `Limits`. Any `###`-or-deeper heading whose nearest `##` heading is not `Details` is a problem. An example document a README shows inside a fenced block, with headings such as `## Summary`, is therefore ignored.
- **Test cases table (R11).** The table is the run of lines starting with `|` after `## Test cases`, skipping the header row and the `:----` row. The first cell's backticks are stripped to get the case name and the second cell is trimmed. Problems reported: a case with no row, a row naming no case, a duplicate row, and a goal that differs from `case.yaml` (both texts shown).
- **Reading `case.yaml` (R13).** Read line by line, because Bash, `jq` and Python stdlib have no YAML parser, so only the simple forms every case uses today are understood (operator decision, 2026-11-05). `name:` is the top-level line starting `name:`. The files under `context:` are the values of the indented `key: value` lines that follow `context:` until the next unindented line. Any other form for these two keys (flow maps such as `context: {...}`, quoted keys, multi-line values) is reported as `case.yaml: cannot read <key>` rather than guessed at.
- **Output (R14, R15).** Header: `== <check>`. Problem: `<path>: <problem>`. Summary: `check: failed: <checks>` or `check: all passed`.

## Out of scope / Deferred
- Linting `.specs/`. C7 leaves it out.
- Running evals. That is F6, `make evals` (C8).
- Checking a README's prose against the template's rules (present tense, no contradiction with `SKILL.md`, the "Test cases live in" link line). Only the structure in C13 is checked.
- Running `make check` automatically, from a hook or CI. Not asked for.
- Adding a plugin icon. The missing-icon warning fails neither validate command.

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. `make check` in the plugin root. |
| C2 | R4. |
| C3 | R4. |
| C4 | R5. |
| C5 | R7 to R11. |
| C6 | R12, R13. |
| C7 | R16. |
| C8 | R16. |
| C9 | R2. The scripts live in this plugin and are not shared with sdlc. |
| C10 | R2. |
| C11 | R6, R7, R12. |
| C12 | R7. |
| C13 | R8 to R11. |
| C14 | R12, R13. |
| C15 | R12. |
| C16 | R14, R15. |
| C17 | R3. |

## Open questions from the intent
None.

## Areas of concern
None.
