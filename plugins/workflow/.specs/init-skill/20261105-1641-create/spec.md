---
agent: claude
operator: Russell Sherman
skills: policy-skill-authoring
---
# Spec: Create init skill

## Requirements
- R1. A skill exists at `skills/init/SKILL.md` with `name: init` and `disable-model-invocation: true`. It runs only when the user types `/workflow:init`; the model never starts it.
- R2. The work is done by a bundled Bash script, `skills/init/init.sh`. `SKILL.md` runs it through a single `` !`bash ${CLAUDE_SKILL_DIR}/init.sh` `` line, so it runs before the model sees the skill, and pre-approves exactly that command in `allowed-tools` as `Bash(bash ${CLAUDE_SKILL_DIR}/init.sh)`. No arguments are passed to the script; any text after `/workflow:init` changes nothing (operator decision, 2026-11-05).
- R3. The target directory is the output of `git rev-parse --show-toplevel` when that succeeds in the current directory, and the current directory otherwise, including when `git` is not installed. `<path>` below is the absolute path of `.handoff/.gitignore` in the target directory.
- R4. When `<path>` is a regular file or a symlink (including a broken one), the script changes nothing and prints `Already present, left unchanged: <path>.` (operator decision, 2026-11-05).
- R5. When nothing exists at `<path>`, the script creates `.handoff/` if it is missing, then creates `<path>` containing exactly `*` followed by a newline, without ever overwriting a file, and prints `Created <path>.`
- R6. When `<path>` can't be created, the script prints `Nothing changed: <reason> (<path>).`, where `<reason>` is a short phrase saying what is in the way. This covers at least: something other than a regular file or symlink at `<path>` (for example, a directory); `.handoff` existing as something other than a directory; and a directory or file that can't be created. If the script created `.handoff/` in this run and then fails to create `<path>`, it removes that empty directory again, so the run leaves nothing behind. It never deletes, moves or changes anything that existed before the run (operator decision, 2026-11-05).
- R7. The script prints exactly one line, one of the three forms in R4 to R6, and exits 0 in every case, so a failure never aborts the skill.
- R8. The model's reply is the script's line, exactly and alone. It makes no tool calls.
- R9. When shell execution for skills is disabled by policy (the `disableSkillShellExecution` setting, so `[shell command execution disabled by policy]` appears where the script's line would be), the model replies exactly `Nothing changed: shell execution for skills is disabled by policy, so /workflow:init could not run.` and makes no tool calls. It never creates the file another way.
- R10. The script creates or changes nothing outside `.handoff/` in the target directory. It never reads or edits the project's own `.gitignore`.
- R11. The script uses only Bash built-ins and standard commands that come with the OS, plus `git` when present. It needs no `jq` and nothing outside the plugin, and passes `make shellcheck`.
- R12. `tests/init.sh` tests the script directly against temporary directories, with no model calls. It covers at least: inside a git repository, from the root and from a subdirectory; outside a git repository; with `git` not on `PATH`; already present with content other than `*`; a symlink at `<path>`, including a broken one; a directory at `<path>`; `.handoff` as a regular file; a target directory that can't be written to (including that no `.handoff/` is left behind); and that every run prints one line and exits 0.
- R13. `make check` runs every `tests/*.sh` file, so it runs `tests/lints.sh` and `tests/init.sh`, as a new `tests` step, with its own target `make tests`. Like the other steps, it runs even after an earlier one fails and is named in the summary line. `.claude/CLAUDE.md` lists `make tests` in place of the `bash tests/lints.sh` line (operator decision, 2026-11-05).
- R14. Documentation exists at `docs/skills/init/README.md` in the plugin directory and follows `docs/skills/README_TEMPLATE.md`. It covers what `/workflow:init` is for; that it is invoked by its qualified name because `/init` is a built-in; where it puts `.handoff/.gitignore`; that the file contains `*` and so ignores itself, which means each fresh clone needs `/workflow:init` again before `/handoff` works; that an existing file is never changed; the three reply forms (R4 to R6); and the skill's test cases, each with its goal.
- R15. The skill is built under policy-skill-authoring: skill-creator invoked first, its full workflow, and test cases as case folders under `evals/init/` at the plugin root (ROADMAP D4), each with a `# Goal: Checks that …` first line in `case.yaml`.

## Design
- **The skill (R1, R2, R8, R9).** `skills/init/` holds `SKILL.md` and `init.sh`. The `SKILL.md` body is short: the injected line, then the instruction to reply with that line exactly and call no tools, then the R9 fallback. Shape:

  ```markdown
  ---
  name: init
  description: "Prepares the project for workflow skills that write files into it: creates .handoff/.gitignore. Invoked only by /workflow:init."
  disable-model-invocation: true
  allowed-tools: Bash(bash ${CLAUDE_SKILL_DIR}/init.sh)
  ---

  !`bash ${CLAUDE_SKILL_DIR}/init.sh`

  Reply with the line above, exactly, and nothing else. Do not call any tools.
  If the line above is "[shell command execution disabled by policy]", reply exactly: …
  ```

  Running the script before the model sees the skill makes the outcome deterministic: the model can't take a different path, and its only job is to relay one line.
- **Why the script always exits 0 (R7).** A command that fails in a ``!`…` `` line aborts the whole skill invocation, and Claude never sees the skill content (code.claude.com/docs/en/skills.md, checked 2026-11-05). Every failure is therefore reported as an R6 line on stdout, never as an exit code. The `allowed-tools` grant stops an unapproved command from aborting the invocation outside auto mode (same page).
- **The script (R3 to R7, R10, R11).** In order:
  1. `root=$(git rev-parse --show-toplevel 2>/dev/null) || root=$PWD`.
  2. If `<path>` is a symlink or a regular file (`[ -L ]` or `[ -f ]`): R4.
  3. If anything else exists at `<path>` (`[ -e ]`): R6.
  4. If `.handoff` exists and is not a directory (`[ -e ] && ! [ -d ]`): R6. A symlink to a directory counts as a directory.
  5. If `.handoff/` is missing: `mkdir`, and note that this run created it. On failure: R6.
  6. Write the file with `set -o noclobber` (`printf '*\n' > "$path"`), so an existing file is never overwritten, even one created between the checks and the write. On failure: remove `.handoff/` with `rmdir` only if this run created it, then R6.
  7. R5.

  It matches `/handoff`'s rule for the directory (`handoff-skill/20261028-0830-create-skill` R5), so `/handoff` always finds the file `init` created. It also matches R6 there: `/handoff` counts any existing file as present, and so does `init` (R4).
- **Where the injected command runs.** R3 assumes the injected command runs in the session's current directory. The plan's first step checks this with a live `/workflow:init` run before the skill is built; if it's wrong, this spec changes before work goes on.
- **Script tests (R12, R13).** `tests/init.sh` makes a temporary directory for each case, runs `bash skills/init/init.sh` from inside it, and checks the printed line, the exit code, and the files left behind. The `git`-not-installed case runs with a `PATH` that has no `git`. The read-only case uses `chmod`; when run as root, it is skipped with a note. `scripts/check.sh` gets a `tests` step that runs each `tests/*.sh`, plus a `make tests` target. This is a small follow-up to `check-target/20261105-1153-create`. ROADMAP F5's list of parts gets the new step.
- **No baseline runs (R15).** `/workflow:init` is command-only (R1), so under policy-skill-authoring no baseline runs are made in any iteration, by skill-creator or by `claude plugin eval`. The operator is told the baselines were skipped and why. Description optimization is also skipped, since command-only skills are exempt from it.
- **Eval cases (R15).** These check that the model relays the line and does nothing else; the script's edge cases are covered by R12 without model calls. skill-creator's test-case step settles the set with the operator. Proposed starting set:
  - `creates-gitignore`: Checks that in a git repository with no `.handoff/`, `.handoff/.gitignore` is created containing `*`, the reply is exactly the `Created` line, and no tool is called.
  - `already-present`: Checks that a `.handoff/.gitignore` with content other than `*` is unchanged and the reply is exactly the `Already present` line.
  - `outside-git-repo`: Checks that outside a git repository the file is created in the current directory.
  - `handoff-is-a-file`: Checks that when `.handoff` is a regular file, nothing changes and the reply is one `Nothing changed` line.
  - `ignores-arguments`: Checks that text after `/workflow:init` changes nothing about what is created or replied.
  - `project-gitignore-untouched`: Checks that the project's own `.gitignore` is byte-for-byte unchanged.

  Each case's scaffold sets up the directory (`git init` where needed). A case for R9 is added only if `claude plugin eval` lets a case set `disableSkillShellExecution`; otherwise R9 is checked by hand once and recorded in the plan.

## Out of scope / Deferred
- Scaffolding anything other than `.handoff/.gitignore`. Each later skill that needs a project file gets its own change to `init` (intent C6). Deferred.
- Checking or repairing the contents of an existing `.handoff/.gitignore`. It is the user's file (intent C5).
- Any interaction with sdlc or `/sdlc:init` (intent C8).
- Changes to `/handoff`. It already points users to `/workflow:init` and checks only that the file exists.
- Listing `/workflow:init` in the plugin's own `README.md`. That is the roadmap's separate Documentation item.

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. |
| C2 | R1, R2. The command-only flag stops the model from starting it, and the script runs with no confirmation step. |
| C3 | R3, and the script design point (same rule as `/handoff` R5). |
| C4 | R5. |
| C5 | R4. |
| C6 | R5, R6, R10. |
| C7 | R2. |
| C8 | R11, and Out of scope. Nothing in the skill or script refers to sdlc. |
| C9 | R6, R7. |
| C10 | R4 to R9. |
| C11 | R15. |
| C12 | R2, R11. |
| C13 | R14. |

## Open questions from the intent
None.

## Areas of concern
None.
