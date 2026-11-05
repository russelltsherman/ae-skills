---
agent: claude
operator: Russell Sherman
---
# Plan: Create check-target

## Files that change
- Makefile (new)
- scripts/lib.sh (new)
- scripts/check.sh (new)
- scripts/validate.sh (new)
- scripts/shellcheck.sh (new)
- scripts/lint-readmes.sh (new)
- scripts/lint-evals.sh (new)
- tests/lints.sh (new)
- .claude/CLAUDE.md
- ROADMAP.md

## Order of work
1. Write `scripts/lib.sh`: the plugin root worked out from the script's own location (`cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd`); `header <check>` printing `== <check>`; `problem <path> <text>` printing `<path>: <text>` and counting problems; `need <tool>...` using `command -v` and reporting `<tool>: not installed` for each missing one; `skills` (folder names of `skills/*/SKILL.md`, sorted) and `cases <skill>` (direct subfolders of `evals/<skill>/` except `results`, sorted). It is Bash 3.2-safe: no `mapfile`, no associative arrays, no `${var,,}` (R2, R3, R6, R14).
2. Write `scripts/validate.sh`: `need claude jq`, then run `claude plugin validate --strict .` and `claude plugin validate --profile directory .` from the plugin root with their output passed through unchanged, failing when either exits non-zero (R3, R4).
3. Write `scripts/shellcheck.sh`: `need shellcheck jq`, then `find . -path ./.specs -prune -o \( -type d \( -name results -o -name '*-workspace' \) \) -prune -o -type f -name '*.sh' -print`, sorted, passed to `shellcheck --norc`. It fails when `shellcheck` exits non-zero. `.specs` is pruned so the check reads nothing under it (R3, R5, R16).
4. Write `scripts/lint-evals.sh`: `need jq`. For each skill with no cases, report `evals/<skill>: no eval cases`. For each folder in `evals/` that is not a skill, report `evals/<name>: no skill named <name>`. For each case: line 1 of `case.yaml` starts with `# Goal: Checks that`; the top-level `name:` equals the folder name; `prompt.md` exists; `graders/` holds at least one `.md`; and each value under `context:` (the indented `key: value` lines up to the next unindented line) names a file that exists in the case folder. Any other form of `name:` or `context:` is reported as `case.yaml: cannot read <key>` (R3, R6, R12, R13, R14).
5. Write `scripts/lint-readmes.sh`: `need jq`. Read the template's `##` headings from the fenced block under `## Template` in `docs/skills/README_TEMPLATE.md`. For each skill: the README exists (R7); line 1 is `# <skill>` (R8); a Markdown link targets `../../../skills/<skill>/SKILL.md` (R9); outside fenced blocks, the `##` headings match the template's in name and order, with only `Details` and `Limits` allowed to be missing, and `###`-or-deeper headings appear only under `## Details` (R10); the `## Test cases` table lists each case exactly once with its goal equal to line 1 of `case.yaml` minus `# Goal: `, reporting missing, unknown and duplicate rows and differing goals with both texts (R11). Uses the output format from `lib.sh` (R3, R6, R14).
6. Write `scripts/check.sh` and the `Makefile`. `check.sh` runs the four scripts in order (validate, shellcheck, lint-readmes, lint-evals), records each one that exits non-zero, prints `check: failed: <checks>` or `check: all passed`, and exits 1 when any failed. The `Makefile` has `.PHONY` targets `check`, `validate`, `shellcheck`, `lint-readmes` and `lint-evals`, each running one script with `bash` (R1, R15).
7. Write `tests/lints.sh`, run as `bash tests/lints.sh`. For each case it builds a plugin tree in a `mktemp -d` folder: a copy of `scripts/` and `docs/skills/README_TEMPLATE.md`, one skill `demo` with a `SKILL.md`, a valid README and one valid case. It then applies one change, runs the script under test, and checks both the exit status and the expected problem line. It prints `ok` or `FAIL` per case and exits non-zero on any `FAIL`. No fixtures are checked in, and it calls no model (R3, R6 to R14).
8. Add the commands to `.claude/CLAUDE.md`: `make check` and its four targets, and `bash tests/lints.sh` (R1).
9. Run every item in `## Proof` and record the output of `make check` on today's tree.
10. Mark F5 done in `ROADMAP.md` once every item in `## Proof` passes (R1).

## Risks
- macOS ships Bash 3.2 as both `/bin/bash` and `bash` on `PATH`. Bash 4 features would break the scripts there (spec R2). Step 1 rules them out. `make shellcheck` runs on the new scripts themselves, and `tests/lints.sh` runs them under the same `bash`.
- Line-by-line `case.yaml` reading can misread a form it does not expect (spec Design: Reading `case.yaml`). Unknown forms for `name:` and `context:` are reported as `cannot read`, not guessed. A `tests/lints.sh` case covers a flow-map `context:`. A top-level key after `context:`, such as `execution:`, ends the block, and a test case covers that too.
- Template headings read at run time from `README_TEMPLATE.md` could pick up the `##` headings in the template's own prose, such as `## Rules` (spec R10). Only lines inside the fenced block under `## Template` are read, and a test checks that a README with exactly the template's headings passes.
- `find` would walk `.specs/`, which spec R16 forbids reading. It is pruned in step 3.
- R13 requires line 1 of `case.yaml` to start with `# Goal: Checks that`, with no space required after it, so a goal such as `Checks that, for…` passes. The README lint (R11) compares against the same line, so a README and its cases cannot disagree about a goal.
- With `make check` passing on today's tree, nothing on the real tree shows that a failing check does not stop the others (R15). A manual check under `## Proof` makes `lint-readmes` fail on purpose and restores the tree afterwards.
- The lints do not flag eval cases left in the old layout (`skills/<skill>/evals/`; spec Out of scope). Any `place-files.sh` files left there are still shellchecked, so the shellcheck check passes or fails the same whether or not they are there.
- `claude plugin validate` output or exit codes may change between Claude Code versions (spec R4). The output is passed through unchanged, so a change shows up in the output instead of being hidden.

## Proof
- `bash tests/lints.sh` exits 0 and prints `ok` for each of these cases:
  - The unchanged fixture passes both lints (R6 to R13).
  - A `demo-workspace/` skill folder with no `SKILL.md` and a `results/` folder in `evals/demo/` are not treated as a skill or a case (R6).
  - Missing README (R7); wrong title line (R8); missing `SKILL.md` link (R9).
  - Headings (R10): a renamed `##` heading, two `##` headings swapped, an extra `##` heading, and a `###` under `## How to use it` are each reported. A README without `Details` and `Limits` passes. A `## Summary` inside a fenced block is ignored.
  - Test cases table (R11): a missing row, a row for no case, a duplicate row, and a goal differing from `case.yaml` are each reported.
  - Folders in `evals/` (R12): a skill with no cases, and a folder in `evals/` with no matching skill, are each reported.
  - Case files (R13): a goal line that does not start with `# Goal: Checks that` (`# Goal: says hi.`), a `name:` that differs from the folder name, a missing `prompt.md`, an empty `graders/`, a missing file named under `context:`, and a flow-map `context: {…}` reported as `cannot read context` are each reported. A top-level `execution:` after `context:` is not read as a context file.
  - Missing tool (R3): with `PATH` set to a folder of links to the system tools minus `jq`, the lint reports `jq: not installed` and exits non-zero.
  - Output format (R14): every problem line matches `^[^ ].*: ` and its path is relative to the fixture root.
- `make validate` exits 0 and shows both commands' output unchanged, including the `ICON_MISSING` warning (R4).
- `make shellcheck` exits 0 on today's tree, which includes the new `scripts/*.sh` and `tests/lints.sh`. Manual check: put a script with an unquoted variable in a temporary `skills/x-workspace/` and `evals/greet/results/` (create the folder, and remove it afterwards), and confirm `make shellcheck` still exits 0. Then put the same script under `scripts/` and confirm it fails. Remove all three afterwards (R5).
- `make check` on today's tree prints `== validate`, `== shellcheck`, `== lint-readmes` and `== lint-evals`, then `check: all passed`, and exits 0. The only skill, `greet`, has `docs/skills/greet/README.md` and two cases with goal lines, so both lints pass on real data (R1, R7 to R13, R15).
- Manual check, R15: move `docs/skills/greet/README.md` out of the tree and run `make check`. All four checks still run; `lint-readmes` reports `docs/skills/greet/README.md: missing`; the summary is `check: failed: lint-readmes`; `echo $?` prints 2, make's status for a failed recipe; and `bash scripts/check.sh` exits 1. Move the README back and confirm `make check` exits 0 again.
- Manual check, R3 for `make check`: `PATH=/usr/bin:/bin make check` (here `/usr/bin` has `jq` but not `claude` or `shellcheck`) reports both `claude: not installed` and `shellcheck: not installed` in one run, and ends with `check: failed: validate shellcheck`.
- Manual check, R2: `bash --version` and `/bin/bash --version` both report version 3.2, and `bash tests/lints.sh` and `make check` above pass when run under it.
- Manual check, R16: `grep -nE 'plugin eval|claude -p|\.specs' Makefile scripts/*.sh` finds only the `.specs` prune in `scripts/shellcheck.sh`.
- Running from another directory: `make -C plugins/workflow check` from the repo root gives the same output as running it in the plugin directory (spec Design: plugin root).
