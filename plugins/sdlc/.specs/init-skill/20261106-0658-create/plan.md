---
agent: claude
operator: Russell Sherman
---
# Plan: create the init skill

## Files that change
- tests/init.bats (new)
- scripts/init.sh (new)
- skills/init/SKILL.md (new)
- evals/init/ (new)
- README.md
- ROADMAP.md

## Order of work
1. Write `tests/init.bats`. Each test builds a temporary plugin root (a `.claude-plugin/plugin.json` with a `version`, and `.specs/_rules/` holding two small files plus a subdirectory and a dotfile that must not be copied) and a temporary project directory, runs `/bin/bash scripts/init.sh <plugin-root> <project-dir>`, and checks the files, the report lines and the exit status. The cases:
   - A fresh project: the two rule files are copied byte for byte and nothing else is, `.claude/sdlc.md` is byte for byte the R4 text with the version filled in, `.claude/CLAUDE.md` is byte for byte the R6 section, every path is reported `created <path>`, and the exit status is 0 (R3, R4, R5, R6, R8).
   - A re-run on that project: every file is unchanged, the rule files and marker are reported `skipped <path> (exists)`, `.claude/CLAUDE.md` is reported `skipped .claude/CLAUDE.md (has sdlc section)`, and the exit status is 0 (R3, R4, R5, R8).
   - A project that already has its own rule files and a `.claude/CLAUDE.md` without the section, as this repo does: the rule files are unchanged and reported skipped, the marker is created, the section is added after one blank line with every byte before it unchanged, and `updated .claude/CLAUDE.md (added sdlc section)` is reported (R3, R5, R7, R8).
   - R5's blank-line rule: an existing `.claude/CLAUDE.md` with no final newline gets a newline, one blank line, then the section; one that already ends in a blank line keeps it and gets one more blank line, then the section; an empty one ends up holding only the section (R5, R7).
   - A `.claude/CLAUDE.md` that already has a `<!-- sdlc:begin -->` line is unchanged (R5).
   - A root `CLAUDE.md` in the project is never read or changed (R5).
   - A project directory whose name has a space in it works like a fresh project (R11).
   - A project inside a git repository: no commit is made and `HEAD` does not move (R10).
   - Each failed check in R9 (`jq` not on `PATH`, a missing project directory, a plugin root with no rule files, a `plugin.json` with no `version`) exits non-zero, names the check, and leaves the project unchanged (R9).
   - A write that fails after the checks (a regular file named `.claude` in the project, so the marker cannot be written): the rule files are copied and reported `created`, the error is reported, and the exit status is non-zero (R9).
   The tests fail at this point, because the script does not exist yet (R12). Under the spec's Design, Policy scope, this step and the next come before skill-creator.
2. Write `scripts/init.sh` in Bash 3.2 and `jq`, following the spec's design steps 1 to 5: check the inputs, copy the rules, write the marker, add the section, report. The marker text and section text are written inside the script. Make `bats tests/init.bats` pass and `shellcheck scripts/init.sh` clean (R2 to R11, R12, R14).
3. Invoke skill-creator through the Skill tool, as `policy-skill-authoring` rule 1 requires, and run its whole workflow for `skills/init/SKILL.md` (R1, R11, R13):
   - Front matter: `name: init`, a `description`, `disable-model-invocation: true`, and `allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh" *)`.
   - Body: run `bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh" "${CLAUDE_PLUGIN_ROOT}" "${CLAUDE_PROJECT_DIR}"` exactly as written, pass its report on unchanged, tell the operator to review and commit what was created or updated, and do nothing else. On a non-zero exit, pass on the error and stop.
   - Eval cases in `evals/init/<case>/` (`prompt.md` containing `/sdlc:init` with `Bash` in its `allowed_tools`, `case.yaml` whose line 1 is `# Goal: Checks that …`, `graders/`, and a `place-files.sh` scaffold, with `files/` where the case needs input files). Every scaffold runs `git init` and makes one commit, so a grader can check that no further commit is made:
     - `fresh-project`: checks that the rule files, the marker and the section are created and reported as created, and that nothing is committed.
     - `existing-rules-and-claude-md`: checks that existing rule files are left unchanged and reported as skipped, that the section is added after the existing `.claude/CLAUDE.md` text without changing it and reported as updated, and that the marker is created.
     - `already-initialized`: checks that a re-run changes nothing and reports every path as skipped.
   - With-skill runs only, no baseline runs, and no description optimization, under the command-only exemption. Tell the operator that baselines and optimization are being skipped, and why.
   - Label each run as policy rules 5 and 6 say, build the eval viewer, and iterate until the operator accepts the results.
4. Run the cases with `claude plugin eval` (see Proof), with results kept outside the repo, and fix any failures in the skill or the script (R13).
5. Update `README.md`. Add a Usage section saying that `/sdlc:init` sets up a project (planning rules in `.specs/_rules/`, the `.claude/sdlc.md` marker and a pointer section in `.claude/CLAUDE.md`), creates only what is missing and commits nothing. Update Status to say that `init` is the first skill you can run (operator decision, 2026-11-06).
6. Update `ROADMAP.md` D4: the marker is `.claude/sdlc.md`, committed with the project, in place of `.claude/sdlc.local.md` (intent C3).
7. Run both `claude plugin validate` commands (R1).

## Risks
- The skill stops for a permission prompt, and in a non-interactive run never runs the script at all (spec Design, Skill). A probe on 2026-11-06 showed that an `allowed-tools` rule auto-approves the command only when its quoting matches the command exactly. Step 3 uses the quoted form in both places. Eval runs do not honor a skill's `allowed-tools` rule (spec Design, Evals), so they cannot catch this; the manual check in Proof does.
- A project or plugin path with spaces in it breaks the command (R11). Both paths are quoted in the command and inside the script, and a bats test uses a project directory whose name has a space.
- The script uses a feature newer than Bash 3.2 and fails on a stock Mac (R14). The bats tests run it with `/bin/bash`, which is 3.2 on macOS.
- The rules are missing from an installed plugin (spec Design, Shipping). `.specs/_rules/` must be committed before the release that ships `init`. Releasing is a separate step after this plan, and that step checks `.specs/_rules/` in the installed cache.
- `${CLAUDE_PROJECT_DIR}` could point at the git top level instead of the session's start directory (R2). A probe on 2026-11-06 (Claude Code 2.1.319) showed that it is the start directory when that is a subfolder of a git repo. The manual check in Proof repeats this with the real skill.
- Adding the section could alter bytes already in `.claude/CLAUDE.md` (R7). The script only appends, and the bats tests for R5's blank-line cases compare every byte before the section.
- Running the tests or evals could change this repo's own `.specs/_rules/` or `.claude/CLAUDE.md`. The bats tests and the eval scaffolds use only temporary directories, and the work-in-progress skill is never run with this repo as its project (intent C12).

## Proof
- `bats tests/init.bats` passes. Its cases are listed in step 1 and cover R3, R4, R5, R6, R7, R8, R9, R10 and R11's quoting, and run the script under `/bin/bash` (R12, R14).
- `shellcheck scripts/init.sh` exits 0 (R11, R12).
- `claude plugin validate --strict .` and `claude plugin validate --profile directory .` both exit 0 in the plugin directory. This checks the skill's front matter, including `disable-model-invocation: true` and the `allowed-tools` rule (R1). Both commands passed on the plugin as it stood on 2026-11-06, and a probe skill with the same front matter passed `--strict`.
- `grep -x 'disable-model-invocation: true' skills/init/SKILL.md` matches (R1).
- The skill-creator eval viewer for `evals/init/`, with every case labelled with its eval directory and goal, is accepted by the operator (R13).
- `claude plugin eval --eval-dir evals/init --ablation none --scaffold --allow-tools 'Bash(bash *init.sh*)' --no-publish --output-dir "$(mktemp -d)" --report "$(mktemp -d)/report.html" .` exits 0. It exits 1 if any case scores below 1.0. With `--ablation none` there is no baseline arm, `--scaffold` runs the cases' `place-files.sh`, `--allow-tools` gives the runs Bash for the init script only, and the results stay outside the repo. Run non-interactively (as an agent does), it also needs `--trust-plugin`, or it stops at the first-run trust prompt. A probe plugin passed with this form of `--allow-tools` on 2026-11-06 (R3 to R8, R10, R13).
- Manual check: in a scratch git repo, create a subfolder, start `claude --plugin-dir <path to plugins/sdlc>` in it, and run `/sdlc:init` with no permission prompt. `.specs/_rules/`, `.claude/sdlc.md` and `.claude/CLAUDE.md` are created in the subfolder and not at the repo's top level, and `git log` shows no new commits (R1, R2, R10, R11).
