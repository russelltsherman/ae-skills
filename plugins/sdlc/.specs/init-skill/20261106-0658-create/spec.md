---
agent: claude
operator: Russell Sherman
skills: policy-skill-authoring
---
# Spec: create the init skill

## Requirements
- R1. The plugin has a skill at `skills/init/SKILL.md` with `disable-model-invocation: true`. The operator runs it as `/sdlc:init`, and Claude never starts it on its own. It takes no arguments.
- R2. The project is the directory the Claude Code session was started in, given to the skill as `${CLAUDE_PROJECT_DIR}`. The project does not have to be a git repository, and `init` never writes to the git top level when that is a different directory (operator decision, 2026-11-06). This repo adopts the plugin by running `/sdlc:init` in a session started in `plugins/sdlc` (operator decision, 2026-11-06).
- R3. For every regular file directly in `${CLAUDE_PLUGIN_ROOT}/.specs/_rules/`, `init` creates `.specs/_rules/<file>` in the project as an exact copy, creating `.specs/_rules/` if it is missing. Subdirectories and dotfiles are not copied (operator decision, 2026-11-06). A file that already exists in the project is left untouched.
- R4. If `.claude/sdlc.md` does not exist, `init` creates it with exactly this text, where `<version>` is `version` from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` (operator decision, 2026-11-06):

  ```
  ---
  sdlc_version: <version>
  ---
  # sdlc

  This file opts this project in to the `sdlc` plugin. The plugin's hooks act only in projects that have it.

  Commit this file with the project, so CI and hooks see it too.
  ```

  An existing `.claude/sdlc.md` is left untouched.
- R5. If `.claude/CLAUDE.md` does not exist, `init` creates it holding only the `sdlc` section. If it exists and has no `<!-- sdlc:begin -->` line, `init` adds the section at the end: if the file is empty, the section alone; otherwise a newline if the file does not already end with one, then one blank line, then the section. Blank lines already at the end of the file are kept as they are (operator decision, 2026-11-06). If it already has that line, the file is left untouched. `init` never reads or writes a root `CLAUDE.md`.
- R6. The `sdlc` section is exactly this text (operator decision, 2026-11-06):

  ```
  <!-- sdlc:begin -->
  ## sdlc

  This project uses the `sdlc` plugin. Its planning documents live in `.specs/`; read the rules in `.specs/_rules/` before creating, finding or editing anything there.
  <!-- sdlc:end -->
  ```
- R7. `init` changes no existing file except by adding the section to `.claude/CLAUDE.md` as R5 describes, and it leaves every byte already in that file unchanged.
- R8. When it finishes, `init` reports one line per path, relative to the project, in one of these forms (operator decision, 2026-11-06):
  - `created <path>` for a file it created;
  - `updated .claude/CLAUDE.md (added sdlc section)` when it added the section to an existing file;
  - `skipped <path> (exists)` for a rule file or marker that already existed;
  - `skipped .claude/CLAUDE.md (has sdlc section)` when the section was already there.

  It then exits 0. A run that creates nothing is still a success.
- R9. Before writing anything, `init` checks, in this order, that `jq` is on `PATH`, that the project directory exists, that `${CLAUDE_PLUGIN_ROOT}/.specs/_rules/` has at least one regular file, and that `version` can be read from `plugin.json` (operator decision, 2026-11-06). If any check fails, it writes nothing, says which check failed, and exits non-zero. If a write fails after that, it stops, reports what it had already created or updated and the error, and exits non-zero.
- R10. `init` runs no git command that changes the repository, and commits nothing.
- R11. The file work is done by `scripts/init.sh`, written in Bash and `jq` (D7), which takes the plugin root and the project directory as arguments. The skill runs it with `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PROJECT_DIR}` and passes on its report (operator decision, 2026-11-06).
- R12. `scripts/init.sh` passes `shellcheck` and has `bats` tests in `tests/init.bats` covering R3 to R9 and R14: a fresh project, a re-run, a project that already has the rules and a `.claude/CLAUDE.md` without the section (as this repo does), a `.claude/CLAUDE.md` that already has the section, each case of R5's blank-line rule, a project path with a space in it, each failed check in R9, and a write that fails after the checks.
- R13. The skill is built under `policy-skill-authoring`, with eval cases in `evals/init/<case>/` at the plugin root. Because the skill is command-only, its eval runs have no baseline and its description is not optimized.
- R14. `scripts/init.sh` uses only features of Bash 3.2 (no associative arrays, `mapfile` or case-changing expansions), plus POSIX features of the commands it calls that the BSD and GNU versions share, as check-target R18 requires of its scripts (operator decision, 2026-11-06).

## Design
- **Skill (`skills/init/SKILL.md`)** (R1, R11). Its front matter has `disable-model-invocation: true` and an `allowed-tools` rule that allows only `Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh" *)`, so the run does not stop for a permission prompt. The rule's quoting must match the command exactly: a quoted command is not matched by an unquoted rule. The body tells Claude to run `bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh" "${CLAUDE_PLUGIN_ROOT}" "${CLAUDE_PROJECT_DIR}"`, pass on its report unchanged, tell the operator to review and commit what was created or updated, and do nothing else. Claude Code fills in both variables when the skill loads. Neither one is set in the Bash tool's environment, so the script gets them as arguments.
- **Script (`scripts/init.sh`)** (R2–R10, R14). Called as `init.sh <plugin-root> <project-dir>`. The order of work:
  1. Check the inputs in R9's order: `command -v jq` succeeds, the project directory exists, `<plugin-root>/.specs/_rules/` has at least one regular file, and `jq -r .version` on `<plugin-root>/.claude-plugin/plugin.json` returns a value other than `null` or empty.
  2. Rules (R3): for each regular file directly in the rules directory, copy it to `<project-dir>/.specs/_rules/` when it is missing there, and otherwise record it as skipped. Existing files are never overwritten.
  3. Marker (R4): write `.claude/sdlc.md` when it is missing.
  4. Section (R5, R6, R7): if `.claude/CLAUDE.md` is missing, write it with only the section. If it exists and no line equals `<!-- sdlc:begin -->`, append to it: the section alone when the file is empty (`test -s`); otherwise a newline when `tail -c 1` shows the file does not end with one, then a blank line, then the section. Otherwise, record it as skipped.
  5. Report (R8): one line per path, in the forms R8 gives. On a write error (R9), print the lines for what was done so far, then the error, and exit non-zero.
  The script uses only `bash`, `cp`, `mkdir`, `grep`, `tail` and `jq`, and needs no git (R2, R10, R14).
- **Text sources** (R4, R6). The marker text and the section text are written inside the script. Nothing else in the plugin depends on them.
- **Tests (`tests/init.bats`)** (R12, R14). Each test runs the script with `/bin/bash`, which is Bash 3.2 on macOS, against a temporary plugin root and project directory, then checks the files written, the report lines and the exit status.
- **Evals (`evals/init/`)** (R13). Three cases run `/sdlc:init` in a scaffolded project: an empty project, one that already has the rules and a `.claude/CLAUDE.md` without the section, and one that is already initialized. They check that the files are created, updated or skipped and reported as R3 to R8 say, and that nothing is committed. An eval run has no Bash tool unless the operator grants it with `--allow-tools`, and it does not honor the skill's own `allowed-tools` rule (probed 2026-11-06, Claude Code 2.1.319). So each case lists `Bash` in its `allowed_tools`, the runs pass `--allow-tools 'Bash(bash *init.sh*)'`, and the skill's `allowed-tools` rule is checked by hand instead.
- **Policy scope** (R13). For `policy-skill-authoring` rule 1, `scripts/init.sh` and `tests/init.bats` are not part of the skill. They are written and tested before skill-creator is invoked, and skill-creator's workflow covers `SKILL.md` and its eval cases (operator decision, 2026-11-06).
- **Shipping** (R3). The rules reach a project through the installed plugin. A plugin installed from the `ae-skills` marketplace keeps its tracked dot-directories in its cache, so `${CLAUDE_PLUGIN_ROOT}/.specs/_rules/` exists at run time as long as the rule files are committed before the release.

## Out of scope / Deferred
- Deferred: `REVIEW.md`, `evals/`, example policy skills and the permission allowlist (D13). These are later changes, up to the full `init` in Phase 7 (intent C9).
- Deferred: upgrading or migrating files that already exist (D20). Until then, `init` only skips them.
- Deferred: a project whose `.specs/_rules/` has only some of the rule files, possibly from an older plugin version, gets the missing ones added as they are, and a new marker records the current version. The mixed set is left for D20 to migrate (operator decision, 2026-11-06).
- Deferred: running `tests/init.bats` from `make check`. The check-target's lint-tests step runs `bats tests/` (check-target R17), so these tests join `make check` without further change once it is built. Until then they run with `bats tests/init.bats`.
- A root `CLAUDE.md`. `init` writes only `.claude/CLAUDE.md` (intent C5).
- Editing `.gitignore`, running `git init`, or committing. The operator decides what to commit (intent C10).

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. |
| C2 | R3, R11. |
| C3 | R4. The marker is `.claude/sdlc.md`, and its text says to commit it. |
| C4 | R4. `sdlc_version` is read from `plugin.json`. |
| C5 | R5. |
| C6 | R5, R6, R7. |
| C7 | R6. |
| C8 | R3, R4, R5, R8. |
| C9 | Out of scope / Deferred. Only R3 to R6 write files. |
| C10 | R10. |
| C11 | R11, R14. The script uses Bash 3.2, `jq` and coreutils, and the rules ship in the plugin (Design, Shipping). |
| C12 | R12, R13. Tests and evals run against the work-in-progress plugin. This repo is adopted only with a released version. |
| C13 | R13. |

## Open questions from the intent
None.

## Areas of concern
None.
