---
agent: claude
operator: Russell Sherman
skills: policy-skill-authoring
---
# Spec: create the plan skill

## Requirements
- R1. The plugin has a skill at `skills/plan/SKILL.md` with `disable-model-invocation: true`. The operator runs it as `/sdlc:plan`, optionally followed by `<feature>/<change>` or `<change>`, and Claude never starts it on its own. Any text after the change name is the operator's own message, such as answers to questions or the go-ahead to write, and counts as their words (operator decision, 2026-11-06).
- R2. The skill finds the change directory from that argument as `naming.md` says, including the rule for no argument. When more than one directory matches, it lists them and asks which one is meant. When none matches, it says so and writes nothing.
- R3. Before it asks anything or writes anything, the skill checks that `naming.md`, `intent_template.md`, `spec_template.md` and `plan_template.md` exist in `${CLAUDE_PROJECT_DIR}/.specs/_rules/`. If any is missing, it writes nothing, tells the operator to run `/sdlc:init` first, and stops. It reads the rules from those files only, never from the plugin's own copy.
- R4. `SKILL.md` points to the four rule files for everything about change directories and documents, and tells Claude to read the ones it needs before writing. It does not restate their rules.
- R5. The skill never calls `EnterPlanMode` or `ExitPlanMode` and never writes to built-in plan mode's plan file. If the session is in plan mode when the skill runs, it may read and align, but before writing anything it asks the operator to leave plan mode and waits.
- R6. Running `/sdlc:plan` is the operator's request for the plan. Once alignment (R8) ends, the skill writes without asking again.
- R7. The skill writes `plan.md` only when the change directory meets the conditions in `plan_template.md`. When the spec lists concerns, or an intent with `spec: skipped` lists open questions, the skill names each one, asks the operator to decide it, and records each decision as R13 says. It writes no plan while any remain (operator decision, 2026-11-06). When the intent's `operator` is `pending`, or the intent says `spec: required` and there is no `spec.md`, it writes nothing and says why.
- R8. Before writing, the skill makes Claude think critically about the change. Claude reads the intent, the spec and the code they touch, and tests the spec against the code: requirements the code makes hard or that nothing could prove, files the spec missed, and conflicts between the spec and the code. It also asks itself, and the operator, what the change could break, which step is riskiest and which options it chose not to take. It asks its questions a few at a time and waits for answers, until it has none left or the operator tells it to write. It asks them as plain text in its own message, never with the AskUserQuestion tool (operator decision, 2026-11-06).
- R9. To read the project, the skill may read files, search, use read-only subagents, and run read-only `git` commands (`status`, `diff`, `log`, `show`) (operator decision, 2026-11-06). It never runs a `git` command that writes. When `git` fails, it goes on from the files alone.
- R10. Before it writes a Proof item, the skill checks that each command, tool, flag, make target and test path the item names exists. It uses only checks that make no model calls, start no billed run and change no file: for example `command -v <tool>`, `<tool> --help`, or the path existing or being listed as `(new)` in `## Files that change`. It checks a make target by reading the Makefile, never by running `make` (operator decision, 2026-11-06).
- R11. When a check fails, the skill tells the operator what failed and why, proposes a check that does exist, and writes that Proof item only once the operator agrees (operator decision, 2026-11-06).
- R12. The skill writes `plan.md` in the change directory as `plan_template.md` says, with `agent: claude`, and `operator` set to the operator's name from the session: a name they gave in the conversation, or one Claude Code attached to the session's context. If there is neither, it asks.
- R13. When the operator decides something during alignment that changes the intent or the spec, including settling a concern or question under R7, the skill edits `intent.md` or `spec.md` in the same change directory itself, following each template's rules for changing that document. That includes carrying an intent change into the spec. It tells the operator which documents it changed and what changed in them.
- R14. When the change directory already has a `plan.md`, the skill reworks it in place whenever the operator asks, including after implementation under it has started. It reads the current plan and the code as it stands, and changes what alignment changed.
- R15. The skill records as decided only what the operator decided. An answer the skill proposes stays a question until the operator gives it.
- R16. The skill writes no file other than `plan.md`, `spec.md` and `intent.md` in the change directory it found. It never edits code, never starts implementation and never commits.
- R17. After writing, the skill gives the operator the path of `plan.md` and of any document it changed, asks them to review and correct it, applies their corrections in the same session, and stops.
- R18. The skill ships only `SKILL.md`. It needs nothing outside Claude Code, the project's `.specs/_rules/` and the tools the project itself uses.
- R19. The skill is built under `policy-skill-authoring`, with eval cases in `evals/plan/<case>/` at the plugin root. Because it is command-only, its eval runs have no baseline and its description is not optimized.
- R20. The eval cases are four: a spec that still lists a concern, where the run names it, asks, and writes no plan (R7); a ready spec that disagrees with the code, where the run asks before writing (R8); an aligned conversation ending in the operator's go-ahead, where the run writes a `plan.md` that follows the template and cites every requirement (R6, R12); and a spec whose obvious Proof command uses a flag the tool does not have, where the run reports the failed check and asks (R10, R11). Every case is a single prompt. The two cases that must get past alignment, the aligned conversation and the missing flag, give the operator's answers and the go-ahead to write in that prompt, after the change name; no conversation is recorded or resumed (operator decision, 2026-11-06). Every case checks that nothing is committed, no code is edited and plan mode is never entered or exited (R5, R16). A project without `.specs/_rules/` (R3), an argument that matches more than one change directory (R2), reworking an existing `plan.md` (R14) and a decision that changes the spec (R13) are checked by hand instead (operator decision, 2026-11-06).
- R21. When the operator tells the skill to write while some of its questions are still unanswered, the plan has no step that rests on an unanswered question, and `## Risks` lists each one as undecided (operator decision, 2026-11-06).

## Design
- **Skill (`skills/plan/SKILL.md`)** (R1, R4, R18). Front matter: `name: plan`, a `description` for the command list, `disable-model-invocation: true`, and `argument-hint: "[<feature>/<change> | <change>]"`, quoted so YAML does not read it as a list. No `allowed-tools`: the Proof checks are whatever the project uses, so no rule could cover them, and each Bash call is shown to the operator. The body is behavior only: the order of work below, and pointers to `${CLAUDE_PROJECT_DIR}/.specs/_rules/` for everything about directories and documents.
- **Order of work** (R2 to R17).
  1. Check the four rule files (R3); stop if any is missing.
  2. Note whether the session is in plan mode (R5).
  3. Find the change directory (R2), read `naming.md` and the templates, then read `intent.md`, `spec.md` and any `plan.md` there.
  4. Check the gate (R7). Stop on a pending operator or a missing required spec. List any open concern or question as the first things to settle.
  5. Read the code the change touches (R9), with read-only subagents for wide searches.
  6. Align (R8, R7, R13, R15). Say back what Claude understood, name each gap, conflict and risk it found with its evidence, and ask a few questions at a time. Write each decision into the intent or spec as soon as it is made.
  7. Draft the plan, and check each Proof item before writing it (R10, R11). Put any question still unanswered in `## Risks` (R21).
  8. If in plan mode, ask the operator to leave it (R5). Write or rework `plan.md` (R12, R14).
  9. Hand over (R17): paths, what changed, a request for review; apply corrections; stop.
- **Git** (R9). Read-only commands only, used to see which files exist, what changed recently, and, when reworking, what implementation has done so far. `git` fails inside `claude plugin eval` runs on macOS, so no eval case depends on it and the skill does not need it to work.
- **Proof checks** (R10, R11). A check confirms the item can run, not that it passes: the code it tests does not exist yet. A test file the plan creates is checked against `## Files that change`, and its runner and flags are checked against the real tool.
- **Shipping** (R18). Nothing beyond `SKILL.md`: the rules come from the project, and files are written with the Write and Edit tools.
- **Evals (`evals/plan/`)** (R19, R20). Each case's `scaffold_script` copies the rules into the run's workspace from the plugin root at run time (`$(dirname "$0")/../../../.specs/_rules/`) and places the case's change directory and code from `files/`. Every case is a single prompt: the cases that must get past alignment carry the operator's answers and go-ahead after the change name (R1, R20). Proof commands in fixtures avoid `make` and `git`, which fail inside eval runs on macOS. Graders judge documents with `focus: { source: file, path: … }`, the final message with `focus: last_message`, and tool calls with `tool_used`, anchored to the Bash `command` field (for example `max: 0` for `git commit`, `EnterPlanMode` and `ExitPlanMode`, and Writes outside the change directory).
- **Policy scope** (R19). `SKILL.md` and the cases in `evals/plan/` are built through skill-creator's full workflow, invoked first. The plugin has no other file for this skill.

## Out of scope / Deferred
- Running `scripts/lint-specs.sh` on the documents the skill writes. The skill relies on following the templates; `make check` lints this repo's documents (operator decision, 2026-11-06).
- Implementing the plan. That is the later `build` skill.
- Deferred: how `plan` and `build` share updates to `plan.md` once implementation has started. `build`'s own spec decides it (operator decision, 2026-11-06).
- Deferred: what the skill does when a document it edits (R13, R14) is already committed, which the templates say changes only in a commit that says why. For now the operator handles committed documents (operator decision, 2026-11-06).
- A hook that checks a diff against `plan.md`. Deferred to the Stage 4 hooks in `ROADMAP.md`.
- Pre-approving commands with `allowed-tools`. The commands a Proof check needs vary by project.
- Using the skill on real work before it is released (intent C13). This spec and its plan are written by hand (intent C15).

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. |
| C2 | R5. |
| C3 | R6, R7. |
| C4 | R2. |
| C5 | R3, R4. |
| C6 | R12, R14. |
| C7 | R8, R17. |
| C8 | R10. |
| C9 | R15, R21. |
| C10 | R16. |
| C11 | R3. |
| C12 | R18. |
| C13 | R19, R20. Evals run against the work-in-progress plugin with `--plugin-dir`; Out of scope / Deferred. |
| C14 | R19, R20. |
| C15 | Out of scope / Deferred. |
| C16 | R13. |
| C17 | R14. |

## Open questions from the intent
None.

## Areas of concern
None.
