---
agent: claude
operator: Russell Sherman
skills: none
---
# Spec: Create check-target

## Requirements
- R1. `make check`, run from the plugin directory, runs these steps in this order: tools, validate-strict, validate-directory, shellcheck, lint, tests.
- R2. The tools step checks that `git`, `jq`, `shellcheck`, `bats` and `claude` are on `PATH`. It prints `missing tool: <name>` for each one that is not, and fails.
- R3. The validate-strict step runs `claude plugin validate --strict .` and fails when it exits non-zero.
- R4. The validate-directory step runs `claude plugin validate --profile directory .`, without `--strict`, and fails when it exits non-zero.
- R5. The shellcheck step runs `shellcheck` on every file listed by `git ls-files --cached --others --exclude-standard` in the plugin directory whose name ends in `.sh` or whose first line is a shebang naming `sh` or `bash`. Listed paths that are not regular files, such as tracked files deleted from the working tree, are skipped. It fails when `shellcheck` reports anything. With no files to check, it passes.
- R6. Every step runs even after an earlier one fails. Each step's output is headed with its name. The run ends with one summary line naming the failed steps, or saying all passed, and `make check` exits non-zero when any step failed. A step whose tool is missing fails and does not run that tool. The validate steps need `claude`, the shellcheck step needs `git` and `shellcheck`, the tests step needs `bats`, and the lint step needs none of them. A missing `jq` fails only the tools step.
- R7. The lint is `scripts/lint-specs.sh [<specs-dir>]`, defaulting to `.specs`. It prints each problem on its own line as `<path>:<line>: <message>`, or `<path>: <message>` when no single line is at fault. It exits 0 when it finds no problems, 1 when it finds any, and 2 on a usage error or a missing `<specs-dir>`.
- R8. The lint visits every directory `<specs-dir>/<feature>/<change>/` whose `<feature>` does not start with `_`. It reports a `<feature>` that is not a slug of `a-z`, `0-9` and `-`, and a `<change>` that is not `<YYYYMMDD-HHMM>-<slug>` with a non-empty slug, where the timestamp must be a real date and time (month 01–12, a day that exists in that month, hour 00–23, minute 00–59). Documents in a badly named directory are still linted.
- R9. In each `intent.md`, `spec.md` and `plan.md` it finds, the lint checks the front matter. It must open on line 1 with `---`, hold only flat `key: value` lines, and close with `---`. The lint reports missing required keys, unknown keys, duplicate keys, empty values, and values outside the allowed set for `origin`, `type`, `risk` and `spec`. `links` is required in an intent whose `origin` is `ticket`.
- R10. The lint checks the body. The first line after the front matter must be `# Intent: <title>`, `# Spec: <title>` or `# Plan: <title>` for its document. The `## ` headings must be exactly the template's sections, in the template's order. The lint reports a missing, misspelled, misordered or extra section (operator decision, 2026-11-06). Lines inside fenced code blocks are ignored.
- R11. In `## Constraints` and `## Open questions` (intent), and in `## Requirements` and `## Areas of concern` (spec), every line starting with `- ` must read `- <letter><n>. <text>`, where `<letter>` is that section's letter (`C`, `Q`, `R`, `K`) and `<n>` is a positive integer with no leading zero. A section whose only content is `None.` passes. The lint reports an ID that appears twice in its list, and a `C` or `R` bullet whose text starts with `Withdrawn` but does not read `Withdrawn: <reason>. Was: <original text>.`
- R12. When `intent.md` exists beside a `spec.md` or `plan.md`, the title in `# Spec: <title>` and `# Plan: <title>` must equal the intent's title exactly.
- R13. When `intent.md` and `spec.md` both exist, every `C` ID in the intent, withdrawn ones included, appears exactly once in the first column of the spec's `## How each constraint is met` table. Every `Q` ID in the intent appears exactly once as a `- Q<n>.` bullet in the spec's `## Open questions from the intent`. A `C` or `Q` ID in those sections that the intent does not have is reported.
- R14. When `spec.md` and `plan.md` both exist, every `R` ID in the spec that is not withdrawn appears, as a whole word, at least once in the plan's `## Order of work` and at least once in its `## Proof`. A range such as `R7–R14` counts only for its two endpoints (operator decision, 2026-11-06).
- R15. The lint keeps every key, required flag, allowed value, title prefix and section heading it checks in one block at the top of `scripts/lint-specs.sh`. `scripts/lint-specs.sh --rules` prints, in a stable line format, the parts of that block that the template tables hold: keys, required flags, allowed values and section headings. Title prefixes and section ID letters are not printed; the `tests/lint.bats` fixtures cover them (operator decision, 2026-11-06). `tests/rules.bats` parses the `Key`/`Required`/`Values` and `Section` tables in `.specs/_rules/{intent,spec,plan}_template.md`, found by their header rows and ignoring fenced examples, and fails when they differ from `--rules`. A `Required` cell of `yes` maps to `required`, and one of the form ``if `<key>` is `<value>` `` maps to `if <key>=<value>`. A `Values` cell counts as an allowed set only when it is nothing but backticked literals separated by `, ` or ` or `. Any other cell is free text that must not be empty.
- R16. `tests/lint.bats` runs the lint against fixture `.specs/` trees in `tests/fixtures/`. It has one clean fixture that passes, and for every check in R7–R14, at least one fixture that fails with the expected message.
- R17. The tests step runs `bats tests/`, which includes the lint's tests and any other suite in `tests/`, and fails when any test fails. It is named `tests`, not `lint-tests` (operator decision, 2026-11-06).
- R18. `Makefile`, `scripts/check.sh` and `scripts/lint-specs.sh` use only features of Bash 3.2 (no associative arrays, `mapfile` or case-changing expansions), plus POSIX features, shared by the BSD and GNU versions, of the utilities they call (such as `awk`, `sed`, `grep`, `find`, `sort` and `head`). No Python (operator decision, 2026-11-06).
- R19. `.claude/CLAUDE.md` lists `make check` under Commands, replacing the two `claude plugin validate` commands, with the rule to run it before calling any change done.

## Design
- `Makefile` at the plugin root has one target, `check`, and its recipe is `bash scripts/check.sh`. Keeping the step logic in a script gets it shellchecked by R5 and keeps the Makefile trivial (R1).
- `scripts/check.sh` defines each step as a function, runs them in R1's order, prints `== <step>` before each one, records failures, and prints `check: all passed` or `check: failed: <step> <step>…` at the end. It exits 1 if any step failed (R6). The tools step runs first and records which tools are missing. A later step whose tool is missing is marked failed without running it (R2, R6).
- The shellcheck step pipes `git ls-files -z --cached --others --exclude-standard` into a filter that drops paths that are not regular files and keeps a `*.sh` name, or a first line matching `^#!.*[/ ](ba)?sh([[:space:]]|$)`. The matches go to `shellcheck`. `refs/` (its own `.gitignore` is `*`) and `skills/*-workspace/` drop out because git ignores them (R5).
- `scripts/lint-specs.sh` works in three passes (R7):
  1. **Walk:** `find` lists the change directories and checks their names (R8).
  2. **Per document:** one `awk` program per file reads the front matter, title, headings and ID bullets, skipping fenced blocks. It emits problems, plus a small record of the title, the IDs per section, withdrawn IDs, the IDs in the constraint table and Q bullets, and the R words in Order of work and Proof (R9–R11).
  3. **Cross-document:** within each change directory, Bash compares those records (R12–R14).
- Rules block (R15): plain Bash strings, one rule per line, e.g. `intent|key|origin|required|person ticket incident scan band` and `intent|section|2|Proposed outcome`. The block also holds title lines and ID-letter lines, e.g. `intent|title|Intent` and `intent|ids|Constraints|C`, which the lint uses but `--rules` does not print. `--rules` prints the `key` and `section` lines sorted. The drift test builds the same lines from the template tables with `awk` and compares them with `diff`, so a failure shows exactly what differs.
- Tests (R16, R17): `tests/lint.bats` and `tests/rules.bats`, with fixtures as small `.specs/` trees under `tests/fixtures/<case>/`. `make check` lints only the plugin's own `.specs/`, so the deliberately broken fixtures never fail the lint step. Other suites in `tests/`, such as init's `tests/init.bats` and later hook tests, run in the same tests step (C7). `tests/rules.bats` finds its default `RULES_DIR` and the lint from `$BATS_TEST_DIRNAME`, so it works from any directory.
- Only `make check`, through `scripts/check.sh`, and the lint's own tests call the lint. No path in it depends on `${CLAUDE_PLUGIN_ROOT}`. It runs from the plugin directory against a path argument (C8).

## Out of scope / Deferred
- Deferred: running the lint in other projects, from hooks or skills. Only the plugin's `make check` runs it (C8).
- Deferred: hook tests and evals. Hook tests join `make check` when they exist; evals run under the eval-target, never here (C7, C16).
- Deferred: running the directory profile with `--strict`, so listing warnings such as a missing icon fail too. That waits for Phase 7 (C3).
- Fixing documents already in `.specs/` that fail the lint. `make check` stays red until each is fixed under its own feature's change, and a red `make check` means the change is not done; the operator decides case by case (operator decision, 2026-11-06).
- Checks the intent does not ask for: plans of spec-skipped changes citing every `C` ID; `spec: skipped` only with `risk: routine`; no next document while `operator` is `pending`; no plan while the spec lists concerns; `links` only with `origin: ticket`; IDs numbered without gaps; whether a section's content is `None.` where the template allows it; whether the plan's `## Files that change` matches the diff; slug form beyond its allowed characters (leading, trailing or doubled `-`); a withdrawn constraint's row reading `Withdrawn.`; a `spec.md` or `plan.md` with no `intent.md` beside it; stray files or directories under `.specs/`.
- Running `make check` in CI. That is Phase 4 (D15).

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. `Makefile` at the plugin root. |
| C2 | R3. |
| C3 | R4. Out of scope / Deferred: `--strict` on the directory profile waits for Phase 7. |
| C4 | R5. git's ignore rules exclude `refs/` and `skills/*-workspace/`. |
| C5 | R7, R9, R10. |
| C6 | R18. Only the named tools and POSIX utilities; no `gh` call is needed. |
| C7 | Out of scope / Deferred. `tests/` is ready for hook tests to join. |
| C8 | R7. Design: only `make check` and the lint's own tests call the lint. |
| C9 | R9, R10, R13, R14. |
| C10 | R15. |
| C11 | R6. |
| C12 | R2, R6. |
| C13 | R11, R12. |
| C14 | R8. |
| C15 | R19. |
| C16 | R1. `claude plugin validate` is the only `claude` call, and it makes no model calls. |
| C17 | R2, R6. `jq` is required although no step here uses it, because the scripts and hook tests that join `make check` use it (operator decision, 2026-11-06). |
| C18 | R16, R17. |

## Open questions from the intent
None.

## Areas of concern
None.
