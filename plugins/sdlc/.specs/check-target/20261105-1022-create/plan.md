---
agent: claude
operator: Russell Sherman
---
# Plan: Create check-target

## Files that change
Paths are relative to `plugins/sdlc/`.
- Makefile (new)
- scripts/check.sh (new)
- scripts/lint-specs.sh (new)
- tests/lint.bats (new)
- tests/rules.bats (new)
- tests/fixtures/ (new)
- .claude/CLAUDE.md

## Order of work
1. Write `scripts/lint-specs.sh` with only its rules block and argument handling. Start it with `#!/usr/bin/env bash` and make it executable. The rules block holds every key, required flag, allowed set, title prefix, section ID letter and section heading from the three templates, one `doc|kind|…` line each. `--rules` prints only the `key` and `section` lines, sorted. `<specs-dir>` defaults to `.specs`. A missing directory or an unknown option exits 2 (R7, R15).
2. Write `tests/rules.bats`. It finds the lint and its default `$RULES_DIR`, `.specs/_rules`, from `$BATS_TEST_DIRNAME`. It finds the `Key`/`Required`/`Values` and `Section` tables in each template by their header rows, skipping fenced examples, builds the same lines from them with `awk` (`yes` → `required`, ``if `origin` is `ticket` `` → `if origin=ticket`), and `diff`s them against `scripts/lint-specs.sh --rules`. Run `bats tests/rules.bats` until it passes (R15).
3. Add the walk: `find` lists `<specs-dir>/<feature>/<change>/` with `_`-prefixed features skipped, and the lint reports a feature slug with a character outside `a-z`, `0-9` and `-`; a change name without the `<YYYYMMDD-HHMM>-<slug>` shape; an empty change slug; and impossible timestamps (month, day of month with leap years, hour, minute). A badly named directory's documents are still linted. Add a fixture and test per case in `tests/lint.bats`, plus R7's cases: exit 0 on the clean tree, exit 1 with `<path>:<line>: <message>` or `<path>: <message>` lines when problems are found, exit 2 for a missing `<specs-dir>` and for an unknown option (R7, R8, R16).
4. Add the per-document `awk` pass for front matter: opening `---` on line 1, flat `key: value` lines, closing `---`, then missing, unknown, duplicate and empty keys, values outside an allowed set, and `links` required when `origin` is `ticket`. Problems print as `<path>:<line>: <message>`. Add a fixture and test per case (R9, R16).
5. Extend the pass to the body: a missing title line, a wrong title prefix, and `## ` headings compared with the template's list for missing, misspelled, misordered and extra sections. Fenced blocks are skipped. Only a line that starts with `## ` is a heading. The fixtures include a `## ` heading inside a fenced block and a sentence that quotes "`## Areas of concern`" in backticks, and neither counts. Add a fixture and test per case (R10, R16).
6. Extend the pass to ID bullets in `## Constraints`, `## Open questions`, `## Requirements` and `## Areas of concern`: a bullet with the wrong letter, a missing `. `, a leading zero, a `None.` section passing, duplicate IDs, and a `Withdrawn` bullet for `C` or `R` not in the `Withdrawn: <reason>. Was: <original text>.` form. Add a fixture and test per case (R11, R16).
7. Add the cross-document checks in Bash, from the records the `awk` pass emits per change directory: a spec title and a plan title that differ from the intent's; an intent `C` ID missing from, or repeated in, the spec's table; an intent `Q` ID missing from, or repeated in, the spec's Q bullets; a `C` or `Q` ID there that the intent lacks; a spec `R` ID that isn't withdrawn missing as a whole word from the plan's `## Order of work`, and from its `## Proof`, while a withdrawn `R` ID is not required. A range counts only for its two endpoints (spec R14). Add a fixture and test per case (R12, R13, R14, R16).
8. Add the clean fixture, a full change directory with intent, spec and plan that passes. Check that every case named in steps 3 to 7 has its own test in `tests/lint.bats` that fails with the expected message (R16).
9. Write `scripts/check.sh` with one function per step: tools, validate-strict, validate-directory, shellcheck, lint, tests. Each prints `== <step>`, a failure is recorded and the run continues, and the run ends with `check: all passed` or `check: failed: <steps>` and exit 1. A step whose tool is missing fails without running it: the validate steps need `claude`, shellcheck needs `git` and `shellcheck`, and tests needs `bats`. The shellcheck step skips listed paths that are not regular files. Make `scripts/check.sh` executable. Write `Makefile` with the single target `check`, declared `.PHONY`, whose recipe is `bash scripts/check.sh` (R1, R2, R3, R4, R5, R6, R17).
10. Keep `Makefile`, `scripts/check.sh` and `scripts/lint-specs.sh` within Bash 3.2 and the BSD/GNU-common POSIX features of the utilities they call, with no Python, and run every test with `/bin/bash` 3.2 on this machine (R18).
11. Replace the two `claude plugin validate` lines under Commands in `.claude/CLAUDE.md` with `make check`, and the rule to run it before calling any change done (R19).
12. Run every check under `## Proof`. Show the operator the lint's problems in other features' change directories, and leave them unfixed (spec Out of scope, operator decision, 2026-11-06).

## Risks
- `make check` will be red on its first run if documents in other features fail the lint (spec Out of scope). That is the operator's decision. A red `make check` means not done, and the operator decides case by case. For this change, Proof accepts a failed `lint` step only when none of its problems are under `.specs/check-target/`.
- `bats tests/` also runs init's `tests/init.bats` (spec R17). A failure there fails the tests step and must be fixed under init-skill, not here.
- `awk` behaves differently on BSD and GNU (spec R18). Use only POSIX `awk` (no `gensub`, `\b`, `IGNORECASE` or `length(array)`), and match whole-word IDs by checking the characters on each side, not with `\b`. Only BSD `awk` is exercised here, so a GNU-only difference may first show up in CI (Phase 4).
- The drift test parses prose tables (spec R15). A `Values` cell counts as an allowed set only when it is nothing but backticked literals, so free-text cells such as `operator` (which mentions `pending`) are not mistaken for one. The spec template's example table sits in a fenced block and is skipped. `tests/rules.bats` fails loudly with a `diff` rather than passing silently. Title prefixes and ID letters are outside the drift test, so a template change to them is caught only by the `tests/lint.bats` fixtures failing.
- A heading quoted inside a sentence, or inside a fenced example, could be miscounted as a section (spec R10). Step 5 adds both as fixtures.
- This plan is itself linted (spec R14). Every `R` ID is cited on its own in `## Order of work` and `## Proof`, so no citation relies on a range.
- The R5 Proof writes temporary files into the plugin directory and adds one intent-to-add entry to the git index. Each command removes what it added, and `git status --short -uall` is checked afterwards.
- Agents do not commit for now. The work is left uncommitted for the operator to review, and the operator decides when to commit, with `Plan-Approved-By: Russell Sherman` on the first implementation commit.

## Proof
Every command runs from `plugins/sdlc/`.
- R1, R6: `make check 2>&1 | grep '^== '` prints `== tools`, `== validate-strict`, `== validate-directory`, `== shellcheck`, `== lint`, `== tests`, in that order. The last line of `make check` is `check: all passed`, or `check: failed: lint` when other features' documents fail.
- R2, R6: `env PATH=/usr/bin:/bin make check` prints `missing tool: shellcheck`, `missing tool: bats` and `missing tool: claude`, and no line for `git` or `jq` (both are in `/usr/bin`). Its `check:` summary line names `tools`, `validate-strict`, `validate-directory`, `shellcheck` and `tests` as failed, plus `lint` when other features' documents fail, and it exits non-zero. (On a failure, `make` adds its own `Error 1` line after the summary.)
- R3, R4: `claude plugin validate --strict .` and `claude plugin validate --profile directory .` both exit 0 today, despite the `ICON_MISSING` warning. `grep -n 'plugin validate' scripts/check.sh` shows exactly those two commands, with no `--strict` on the second. With a stub that fails, `d=$(mktemp -d); printf '#!/bin/sh\nexit 1\n' > "$d/claude"; chmod +x "$d/claude"; PATH="$d:$PATH" make check` prints the summary `check: failed: validate-strict validate-directory`.
- R5:
  - `printf '#!/bin/bash\necho $1\n' > scripts/zz-proof && make check; rm scripts/zz-proof` shows `shellcheck` reporting SC2086 in `scripts/zz-proof` and names `shellcheck` in the summary.
  - `mkdir -p skills/zz-workspace && printf 'echo $1\n' > skills/zz-workspace/a.sh && make check 2>&1 | grep -c zz-workspace; rm -r skills/zz-workspace` prints `0`. `git check-ignore -q skills/zz-workspace/a.sh` succeeds while the file exists, so the exclusion comes from `skills/*-workspace/` in `.gitignore`.
  - `printf 'echo hi\n' > scripts/zz-del.sh && git add -N scripts/zz-del.sh && rm scripts/zz-del.sh && make check 2>&1 | grep -c zz-del; git rm --cached -q scripts/zz-del.sh` prints `0`.
  - Afterwards `git status --short -uall scripts skills | grep zz` prints nothing.
- R7, R8, R9, R10, R11, R12, R13, R14, R16: `bats tests/lint.bats` passes, with a failing-fixture test for every case named in Order of work steps 3 to 7, the clean fixture, the fenced heading and the backtick-quoted heading. `scripts/lint-specs.sh /nonexistent; echo $?` prints `2`. `scripts/lint-specs.sh .specs | grep -c '^\.specs/check-target/'` prints `0`, so this change's own intent, spec and plan pass.
- R15: `bats tests/rules.bats` passes, and so does `(cd /tmp && bats "$OLDPWD/tests/rules.bats")`. `d=$(mktemp -d); cp .specs/_rules/*_template.md "$d"; sed -i.bak 's/^| `## Risks` |/| `## Hazards` |/' "$d/plan_template.md"; RULES_DIR="$d" bats tests/rules.bats` fails, and its `diff` shows `Risks` and `Hazards`. `scripts/lint-specs.sh --rules | grep -c '|title|'` prints `0`.
- R17: `printf '@test "zz" { false; }\n' > tests/zz-proof.bats && make check; rm tests/zz-proof.bats` names `tests` in the summary.
- R18: `command -v bash` prints `/bin/bash` and `/bin/bash --version | head -1` names version 3.2, so the R1 and R16 runs above use Bash 3.2. `grep -nE 'declare -A|local -A|mapfile|readarray|\$\{[A-Za-z_][A-Za-z0-9_]*(,,?|\^\^?)\}' Makefile scripts/check.sh scripts/lint-specs.sh` prints nothing, and `grep -nE '(^|[^A-Za-z])python[0-9.]*( |$)' Makefile scripts/check.sh scripts/lint-specs.sh` prints nothing.
- R19: `grep -c 'make check' .claude/CLAUDE.md` prints at least `1`, and `grep -c 'claude plugin validate' .claude/CLAUDE.md` prints `0`.
