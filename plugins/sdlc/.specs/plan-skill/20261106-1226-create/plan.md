---
agent: claude
operator: Russell Sherman
---
# Plan: create the plan skill

## Files that change
- skills/plan/SKILL.md (new)
- evals/plan/ (new)
- README.md
- ROADMAP.md

## Order of work
1. Invoke skill-creator through the Skill tool, as `policy-skill-authoring` rule 1 requires, and run its whole workflow for `skills/plan/SKILL.md`. Steps 2 to 5 are stages of that workflow (R19).
2. Draft `skills/plan/SKILL.md` as the spec's Design says (R1 to R18, R21):
   - Front matter: `name: plan`, a `description` for the command list, `disable-model-invocation: true`, and `argument-hint: "[<feature>/<change> | <change>]"`, quoted so YAML does not read it as a list. No `allowed-tools`.
   - Body: behavior only, in the spec's order of work (Design steps 1 to 9), with pointers to `${CLAUDE_PROJECT_DIR}/.specs/_rules/` for `naming.md` and the three templates. No rule from those files is restated (R4).
   - It covers: the four-file rules check and `/sdlc:init` (R3); finding the change directory (R2); plan mode, never entering or exiting it (R5); the gate, including settling concerns and questions first (R7, R13); critical reading and alignment, a few questions at a time, asked as plain text and never with AskUserQuestion (R6, R8, R15); read-only reading, with read-only `git` only (R9); checking Proof items without running `make`, and asking when a check fails (R10, R11); writing or reworking `plan.md` with the operator's name from the session (R12, R14); undecided questions in `## Risks` (R21); the files it may write and what it never does (R16); and the hand-over (R17).
3. Write the eval cases in `evals/plan/<case>/`. Every case is a single prompt; no conversation is recorded or resumed. Each has a `prompt.md` starting with `/sdlc:plan` and the case's change name, a `case.yaml` whose line 1 is `# Goal: Checks that …`, `graders/`, and a `place-files.sh` scaffold named under `context:`. The scaffold copies the rules from `$(dirname "$0")/../../../.specs/_rules/` and the case's `files/` into the run's directory. Fixtures name no `make` or `git` command in anything the run might check. The four cases (R19, R20):
   - `spec-has-concern`: checks that the run names the spec's open concern, asks the operator to decide it, does not record a decision of its own in `spec.md`, and writes no `plan.md` (R7, R15).
   - `spec-disagrees-with-code`: checks that when a requirement names a module the code does not have, the run says so with evidence and asks before writing anything (R8).
   - `aligned-writes-plan`: from a prompt that gives the operator's answers and ends with the go-ahead to write, checks that the run writes `plan.md` in its change directory with the template's front matter, including `operator: Dana Reyes`, and sections, and cites every requirement in `## Order of work` and `## Proof`, and that the final message gives the path of `plan.md` and asks for review (R1, R6, R12, R17). In the prompt the operator introduces themselves as Dana Reyes.
   - `proof-flag-missing`: from a prompt that gives the operator's answers and ends with the go-ahead to write, checks that when the obvious Proof command uses a flag the fixture's `scripts/test.sh --help` does not list, the run reports the failed check, proposes one that exists, and asks (R10, R11).
   Every case also has graders that check, with `tool_used` anchored to the Bash `command` field, that no `git` command that writes is run and that `EnterPlanMode` and `ExitPlanMode` are never called, and that no Write or Edit touches a path outside the case's change directory (R5, R9, R16). Graders judge documents with `focus: { source: file, path: … }` and the report with `focus: last_message`, never with `focus: trace`.
4. Run with-skill runs only, with no baseline runs and no description optimization, under the command-only exemption. Tell the operator that baselines and optimization are skipped, and why (R19). The with-skill runs are `claude plugin eval . --eval-dir evals/plan --ablation none --scaffold --no-publish --keep-temp --allow-tools Bash Write Edit`; each run's trace, final message and workspace files are copied into the skill-creator workspace as its outputs.
5. Label each run as policy rules 5 and 6 say, build the eval viewer, report each case with its eval directory and goal (rule 7), and iterate on the operator's feedback until they accept the results (R19).
6. Run the cases with `make evals` (see Proof) and fix any failures in the skill or the cases (R19, R20).
7. Update `README.md`: add `/sdlc:plan` to Usage, saying that it writes or reworks `plan.md` for a change directory whose spec is ready (or whose intent says `spec: skipped`), asks questions before writing, and edits no code and commits nothing; and change Status to say that `plan` can be built and tried from this repo with `--plugin-dir` but is not released yet (operator decision, 2026-11-06) (R1, R16).
8. Update `ROADMAP.md` Phase 1: replace "`plan` is specified from a spec written by `spec`" with a line saying that `plan`'s spec was written by hand, so `plan` could be built alongside `spec` (intent C15, operator decision, 2026-11-06).
9. Do the manual checks in Proof (R2, R3, R5, R9, R10, R13, R14, R21).
10. Run `make check` (R1).

## Risks
- An unquoted `argument-hint` starting with `[` is read by YAML as a list, and the skill's front matter breaks (R1). Step 2 quotes it, and `claude plugin validate --strict` in `make check` checks the front matter.
- skill-creator's `quick_validate.py` accepts no `disable-model-invocation` key, so it can never pass for this skill. Proof leaves it out and uses `claude plugin validate` instead.
- An `llm` grader with `focus: trace` sees only the first and last 12 messages, so it cannot judge mid-run calls (R20). Step 3 judges tool calls with `tool_used` and content with file or last-message focus.
- A `tool_used` pattern matches a Bash call's `description` as well as its command, and fires falsely (R16). Patterns are anchored to the `"command"` field, and each grader is tried offline against a `claude -p --output-format stream-json` trace before the first billed run.
- `git` and `make` fail inside `claude plugin eval` runs on macOS, so a fixture that leads the run to check a `make` target or run `git` scores on the sandbox, not the skill (R9, R10). Fixtures use `bash scripts/<x>.sh`, and R9's read-only `git` is checked by hand.
- Evals cannot put a session in plan mode, so R5's "ask the operator to leave plan mode" is checked by hand.
- A single eval turn may end in another question instead of a written plan or a Proof check (R8). The two cases that must get past alignment, `aligned-writes-plan` and `proof-flag-missing`, give the operator's answers and the go-ahead to write in their one prompt, so R8 lets the run write and R21 covers anything still unanswered (spec R1, R20).
- Eval runs may need an operator grant for Write and Edit as well as Bash. The `make evals` command in Proof grants all three; granting a tool a run does not need changes nothing.
- These are real, billed runs: four cases at three runs each. Step 6 runs once the viewer is accepted, not on every change while iterating.
- Running the skill against this repo would write into its own `.specs/`. The work-in-progress skill is run only in eval workspaces and a scratch repo (intent C13).

## Proof
- `make check` exits 0. It runs `claude plugin validate --strict .` and `claude plugin validate --profile directory .`, which check the skill's front matter (R1), runs `shellcheck` on every `place-files.sh`, and lints every document in `.specs/`, including this change directory's `intent.md`, `spec.md` and `plan.md`.
- `grep -x 'disable-model-invocation: true' skills/plan/SKILL.md` matches (R1).
- `grep -n 'allowed-tools' skills/plan/SKILL.md` matches nothing (R18).
- `grep -E 'naming\.md|intent_template\.md|spec_template\.md|plan_template\.md' skills/plan/SKILL.md` matches all four names, and the operator reads `SKILL.md` beside the templates and confirms it restates none of their rules (R4).
- `ls skills/plan` lists only `SKILL.md` (R18).
- The skill-creator eval viewer for `evals/plan/`, with every case labelled with its eval directory and goal, is accepted by the operator (R19).
- `make evals SKILL=plan ARGS="--allow-tools Bash Write Edit --trust-plugin"` exits 0. `scripts/evals.sh` adds `--ablation none` because the skill is command-only, and `--scaffold` and `--no-publish`; `claude plugin eval` exits 1 when any case scores below the default threshold of 1.0. The cases are listed in step 3 (R6, R7, R8, R10, R11, R12, R15, R16, R17, R20).
- Manual checks, each in a scratch git repo with one commit, running `claude --plugin-dir <path to plugins/sdlc>` (operator decision, 2026-11-06). In every one, `git log` shows no new commit and no file outside the change directory changes (R16).
  - Plan mode: with a ready spec, start with `--permission-mode plan` and run `/sdlc:plan`. The skill reads and asks questions, but before writing asks to leave plan mode, and never calls `ExitPlanMode` (R5). Leave plan mode and finish alignment: it runs only read-only `git` commands and checks each Proof item without running `make` (R9, R10).
  - Missing rules: in a repo with no `.specs/_rules/`, `/sdlc:plan` tells the operator to run `/sdlc:init` and writes nothing (R3).
  - Ambiguous change: with the same `<change>` slug under two features, `/sdlc:plan <change>` lists both and asks which, writing nothing (R2).
  - Decision edits the spec: with a spec that lists one concern, decide it when asked. The decision lands in `spec.md` with the `(operator decision, <date>)` marker, the concern is deleted, and planning goes on (R7, R13).
  - Rework: with an existing `plan.md` and a requirement added to the spec, `/sdlc:plan` reworks `plan.md` in place to cover it and keeps its other steps (R14).
  - Undecided questions: say "write it now" while one question is unanswered. `## Risks` lists it as undecided, and no step rests on it (R21).
