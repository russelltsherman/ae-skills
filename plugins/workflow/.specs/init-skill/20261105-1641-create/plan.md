---
agent: claude
operator: Russell Sherman
---
# Plan: Create init skill

## Files that change
- skills/init/SKILL.md (new)
- skills/init/init.sh (new)
- tests/init.sh (new)
- scripts/tests.sh (new)
- scripts/check.sh
- Makefile
- .claude/CLAUDE.md
- evals/init/ (new)
- docs/skills/init/README.md (new)
- ROADMAP.md

## Order of work
1. Probe the injected command before the skill is built (spec Design: Where the injected command runs). In the scratchpad, not the repo, make a throwaway plugin `probe` with one command-only skill whose body is `` !`bash ${CLAUDE_SKILL_DIR}/where.sh` `` and whose `allowed-tools` is `Bash(bash ${CLAUDE_SKILL_DIR}/where.sh)`; `where.sh` prints `pwd`, `git rev-parse --show-toplevel` and its own path. Run `claude -p "/probe:where" --plugin-dir <probe>` from (a) a subdirectory of a temporary git repository and (b) a temporary non-git directory. It must show: the command ran with no permission prompt and no abort in `-p` mode, `pwd` is the directory `claude` was started in, and `${CLAUDE_SKILL_DIR}` expanded in both the `!` line and `allowed-tools`. Then run (b) again with `--settings '{"disableSkillShellExecution":true}'` and record whether the body shows `[shell command execution disabled by policy]`. If any of the first three does not hold, stop and raise it with the operator; R2 and R3 change before work goes on. Record the results in this step (R2, R3, R9). Done 2026-11-05: in (a) the command ran with no prompt and printed the subdirectory as `pwd` and the repository as the git root; in (b) `pwd` was the non-git directory and there was no git root; `where.sh` was found at the plugin's path, so `${CLAUDE_SKILL_DIR}` expanded, and the unprompted run under `-p` shows the `allowed-tools` grant matched. With `--settings '{"disableSkillShellExecution":true}'` the body showed `[shell command execution disabled by policy]`, so R9 can be checked with `--settings`.
2. Add the `tests` step to the check-target (R13):
   - `scripts/tests.sh` (new): sources `scripts/lib.sh`, prints `header tests`, runs `bash` on each `tests/*.sh` in sorted order, reports `problem tests/<file> "failed"` for each one that exits non-zero, and ends with `finish`. Bash 3.2-safe like the other scripts.
   - `scripts/check.sh`: `tests` joins the loop after `lint-evals`, so it runs even after an earlier step fails and is named in the summary line.
   - `Makefile`: `tests` joins `.PHONY`, with target `@bash scripts/tests.sh`; the header comment names it.
   - `.claude/CLAUDE.md`: the `bash tests/lints.sh` line becomes `make tests`, which runs every `tests/*.sh`, including the tests for the two lints and for `init.sh`.
   - `ROADMAP.md`: F5's list of parts names the `tests` step and `make tests`.
3. Invoke skill-creator through the Skill tool before writing anything under `skills/init/`, `tests/init.sh` or `evals/init/`. If it can't be invoked, or subagents or `eval-viewer/generate_review.py` are unavailable, stop and tell the operator (R15).
4. skill-creator's capture-intent stage: hand it `intent.md` and `spec.md` from this change directory, and confirm with the operator that nothing is missing (R15).
5. Write `skills/init/init.sh` and `tests/init.sh` together, following the spec's script design point step by step (R3, R4, R5, R6, R7, R10, R11, R12):
   - The script: `set -o noclobber`, no `set -e`; `root=$(git rev-parse --show-toplevel 2>/dev/null) || root=$PWD`; `path=$root/.handoff/.gitignore`. Only `git`, `mkdir`, `rmdir` and Bash built-ins. It takes no arguments and ignores any it is given. Every branch prints one line and exits 0.
   - The `<reason>` phrases for R6 are fixed (operator decision, 2026-11-05):
     - anything other than a regular file or symlink at `<path>`: `.handoff/.gitignore is not a file`
     - `.handoff` exists and is not a directory: `.handoff is not a directory`
     - `mkdir` of `.handoff` fails: `cannot create .handoff/`
     - writing `<path>` fails: `cannot write .handoff/.gitignore`

     For example: `Nothing changed: .handoff is not a directory (/repo/.handoff/.gitignore).`
   - `tests/init.sh`, in the style of `tests/lints.sh` (a `mktemp -d` root removed on exit, `ok`/`FAIL` lines, `all ok` and exit 0 only when every case passes). Each case makes its own directory, runs `bash <plugin>/skills/init/init.sh` from inside it, and checks the exact line, that stdout has exactly one line, that stderr is empty, exit 0, and the files left behind. Cases:
     - git repository, run from the root: `Created <root>/.handoff/.gitignore.`, file is exactly `*\n`.
     - git repository, run from a subdirectory: the file is at the git root, not in the subdirectory.
     - not a git repository: the file is in the current directory.
     - `git` not on `PATH`: `PATH` is a temporary folder holding symlinks to `bash`, `mkdir` and `rmdir` only, so `git` can't be found on any OS layout; the file is in the current directory.
     - extra arguments (`init.sh foo --bar`): the same result as with none.
     - already present with content `keep me`: `Already present, left unchanged: <path>.`, content and mtime unchanged.
     - symlink at `<path>` to an existing file, and a broken symlink: `Already present` line, link and target unchanged.
     - directory at `<path>`: `.handoff/.gitignore is not a file` line, directory unchanged.
     - `.handoff` is a regular file: `.handoff is not a directory` line, file unchanged.
     - `.handoff` is a symlink to a directory: the file is created inside the linked directory.
     - target directory not writable (`chmod a-w`): `cannot create .handoff/` line, no `.handoff` left behind.
     - `.handoff/` exists but is not writable: `cannot write .handoff/.gitignore` line, `.handoff/` still there and empty.
     - `.handoff/` created by this run, then the write fails (run with `umask 0277`, so the new `.handoff/` has no write bit): `cannot write .handoff/.gitignore` line, and no `.handoff` left behind.
     - the project's own `.gitignore`, with content, is byte-for-byte unchanged after a `Created` run.
     - When run as root, the three permission cases are skipped with a `skip` line naming the reason.
   - Run `bash tests/init.sh` until it prints `all ok`.
6. Draft `skills/init/SKILL.md` to the spec's shape: `name: init`, the description from the spec, `disable-model-invocation: true`, `allowed-tools: Bash(bash ${CLAUDE_SKILL_DIR}/init.sh)`; the body is the injected line, the instruction to reply with that line exactly and call no tools, and the R9 fallback with its exact reply (R1, R2, R8, R9).
7. skill-creator's test-case stage. Settle the case set with the operator, starting from the spec's proposed six (`creates-gitignore`, `already-present`, `outside-git-repo`, `handoff-is-a-file`, `ignores-arguments`, `project-gitignore-untouched`). Each is `evals/init/<case>/` with `# Goal: Checks that …` on line 1 of `case.yaml`, `prompt.md` (`/workflow:init`, with trailing text for `ignores-arguments`), `graders/`, and a `setup.sh` scaffold named under `context: scaffold_script:` that builds the case's directory (`git init`, existing files). A case for R9 is added only if step 1 showed that `--settings` reaches the skill and the case format can set it; otherwise R9 is the manual check in `## Proof`. If the runs in step 8 or the `make evals` run in step 11 show the injected command needs a grant, add `evals/init/allow-tools` with it. `make lint-evals` reports nothing for `evals/init/` (R15). Done 2026-11-05: the operator settled the spec's six cases, with R9 as the manual check. Graders use `claude plugin eval`'s `regex` type on the reply (`target: last_message`) and on file contents (`target: {source: file, path: …}`), `file_exists`, and an `llm` trace grader for "no tool calls". A first `claude plugin eval` run of `creates-gitignore` showed the runner gates Bash out of every run unless granted, so the injected line was denied and the skill aborted; `evals/init/allow-tools` now grants `Bash(bash *init.sh)`, and the rerun scored 1.00.
8. Run iteration 1, with-skill only, in `skills/init-workspace/iteration-1/<case>/`, with R8 metadata (`EVAL: evals/init/<case>`/`TEST GOAL:` header, `eval_dir`, `goal`) for each case. Each with-skill subagent runs the case's `setup.sh` in a fresh temporary directory, then runs `claude -p "/workflow:init" --plugin-dir <plugin dir> --output-format stream-json --verbose` there, so the real slash command and its injection run (operator decision, 2026-11-05). It saves the stream-json transcript, the final reply, and a listing plus contents of everything under `.handoff/` and the project `.gitignore` to the run's `outputs/`. No baseline runs: `/workflow:init` is command-only; tell the operator baselines were skipped and why (R15).
9. Grade every run against the case's graders, then copy input files per the policy, build the viewer with `generate_review.py`, and summarize in chat with each case's eval dir and goal (R15).
10. Iterate on the operator's viewer feedback, a new `iteration-N/` each round, until the operator accepts the results. Description optimization is skipped (command-only); tell the operator (R15). Iteration 1 (2026-11-05): 18/19; `ignores-arguments` added two sentences about the ignored request after the line (R8). The operator accepted the proposed fix, a sentence in `SKILL.md` saying not to do, mention or offer other work asked for after the command, and iteration 2 reran all six cases.
11. Run `make evals SKILL=init ARGS="--runs 1"` once on the accepted skill, as the check that the cases also pass under `claude plugin eval` (R15).
12. Write `docs/skills/init/README.md` from `docs/skills/README_TEMPLATE.md`, covering every topic R14 lists and the case list from `evals/init/` with each goal (R14).
13. Run every item in `## Proof`. Mark S2 done in `ROADMAP.md` once they pass.
14. Stop for the operator's review. Agents do not commit. The operator's first commit of this work carries the trailer `Plan-Approved-By: Russell Sherman` and notes the final iteration's pass rates.

## Risks
- The injected command might not run in the session's current directory, or `${CLAUDE_SKILL_DIR}` might not expand in `allowed-tools`, so the command prompts or aborts (spec Design: Where the injected command runs, R2, R3). Step 1 proves both with a throwaway probe before anything is built, and the work stops there if either fails.
- A failing `!` command aborts the whole skill invocation (spec Design: Why the script always exits 0, R7). The script has no `set -e`, sends `git`'s stderr to `/dev/null`, and turns every failure into an R6 line; `tests/init.sh` checks exit 0 and empty stderr in every case.
- A file appears at `<path>` between the checks and the write (spec R5). `noclobber` makes the write fail instead of overwriting, which is reported as `cannot write .handoff/.gitignore`. This race isn't tested.
- Removing `.handoff/` after a failed write could remove something that existed before the run (spec R6). The script uses `rmdir`, never `rm`, and only when it created `.handoff/` in this run; the `umask 0277` case and the not-writable `.handoff/` case check both sides.
- On macOS `git` lives in `/usr/bin` beside the standard commands, and on merged-`/usr` Linux in `/bin` too, so trimming `PATH` doesn't hide it (spec R12). The test builds a `PATH` of symlinks to only the commands the script needs.
- Permission cases pass trivially when run as root (spec R12). They are skipped with a note under root.
- Nested `claude -p` runs in step 8 are billed, may need the operator's normal login, and may not match what an interactive session does (operator decision, 2026-11-05). Step 1 shows `-p` runs the injection; step 11 cross-checks under `claude plugin eval`. Each case is one run per iteration.
- The model adds words around the line or calls a tool anyway (spec R8). Every case has graders for "reply is exactly the line" and "no tool calls".
- R9 may not be testable: `disableSkillShellExecution` may apply only from managed policy, not `--settings` (spec R9). Step 1 records whether `--settings` works; if not, R9 is checked by reading `SKILL.md`, as named in `## Proof`.
- The new `tests` step makes `make check` fail on any failing test file, including on a machine without `git` (spec R13). `tests/init.sh` needs `git` only for the git-repository cases; it reports `git` as not installed, like `need` in `scripts/lib.sh`, rather than failing in a confusing way.
- The README goes stale against `SKILL.md` or the cases (spec R14). It is written last, and `make lint-readmes` checks its case list and goals against `evals/init/`.

## Proof
- Step 1 probe results, recorded in step 1: no prompt or abort under `claude -p`, `pwd` is the start directory in both (a) and (b), `${CLAUDE_SKILL_DIR}` expanded in both places, and whether `--settings` disables shell execution (R2, R3, R9).
- `bash tests/init.sh` prints `all ok` and exits 0, with one `ok` line per case listed in step 5 (R3, R4, R5, R6, R7, R10, R11, R12).
- `make tests` prints `== tests`, runs `tests/init.sh` and `tests/lints.sh`, and exits 0. With a temporary `tests/zz-fail.sh` that runs `exit 1`, `make check` still runs every step, ends `check: failed: tests`, and exits non-zero; the file is removed afterwards (R13).
- `make check` on the finished tree prints `check: all passed`: plugin validation of the new skill's front matter (R1), shellcheck on `skills/init/init.sh`, `tests/init.sh`, `scripts/tests.sh` and the cases' `setup.sh` (R11), the README against the template and `evals/init/` (R14), and every `evals/init/` case folder (R15).
- `make validate` (`claude plugin validate --strict .`) passes with the new skill's front matter (R1). skill-creator's `quick_validate.py` is not used: it rejects `disable-model-invocation`, a Claude Code key it doesn't know, for every command-only skill, including `greet` (checked 2026-11-05).
- `grep -nE 'jq|sdlc|\.gitignore' skills/init/init.sh` shows `.gitignore` only in the `.handoff/.gitignore` path, and no `jq` or `sdlc` (R10, R11).
- `.claude/CLAUDE.md` lists `make tests` and no longer lists `bash tests/lints.sh` (R13).
- Evals in `evals/init/`, run through skill-creator's loop with nested `claude -p` runs and accepted by the operator in its viewer: every case's reply is exactly the expected line, no tool calls, and the files in `outputs/` match the case (R1, R2, R4, R5, R6, R8, R10, R15). The settled cases and what each proves are listed in the step 9 summary and in the README.
- `make evals SKILL=init ARGS="--runs 1"` ends `evals: all passed` (R15).
- Manual check, R1: in an interactive session, the model doesn't start `init` on "set this project up for handoff"; typing `/workflow:init` does.
- Manual check, R9: if step 1 showed `--settings` works, `claude -p "/workflow:init" --settings '{"disableSkillShellExecution":true}' --plugin-dir .` from a temporary directory replies exactly the R9 line, makes no tool calls, and creates no `.handoff/`. Otherwise, `SKILL.md` states the R9 reply word for word and says to call no tools.
- Manual check, R14: `docs/skills/init/README.md` covers each topic R14 lists.
- `git status` shows no `*-workspace/` paths and no change outside `## Files that change`.
