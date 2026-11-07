---
agent: claude
operator: Russell Sherman
skills: workflow:policy-skill-authoring
---
# Spec: create the intent skill

## Requirements
- R1. The plugin has a skill at `skills/intent/SKILL.md` with `disable-model-invocation: true`. The operator runs it as `/sdlc:intent`, optionally followed by a description of what they want, and Claude never starts it on its own (operator decision, 2026-11-06). With no description, the skill asks the operator what they want.
- R2. Before it asks anything or writes anything, the skill checks that `${CLAUDE_PROJECT_DIR}/.specs/_rules/naming.md` and `${CLAUDE_PROJECT_DIR}/.specs/_rules/intent_template.md` exist. If either is missing, it writes nothing, tells the operator to run `/sdlc:init` first, and stops. It reads the rules from those two files only, never from the plugin's own copy.
- R3. `SKILL.md` points to `naming.md` for the change directory and to `intent_template.md` for the document's front matter, sections and rules, and tells Claude to read both before writing. It does not restate their rules.
- R4. Before writing, the skill makes Claude think critically about what the operator wants. Claude tests it against the project, names the gaps, inconsistencies and constraints that cannot be checked, and asks the analyst's questions (scope, users, constraints, what success looks like). It goes on asking until it has no question the operator has not answered, or the operator tells it to write. It asks in plain text in its own message and waits for the answer; it does not use the `AskUserQuestion` tool (operator decision, 2026-11-06).
- R5. To test what the operator says and to find related changes to cite, the skill may read the project: code, docs and existing change directories. It records the problem, outcome and constraints in the operator's terms and proposes no design.
- R6. Running `/sdlc:intent` is the operator's request to write. Once R4's alignment ends, the skill writes without asking again (operator decision, 2026-11-06). Questions still unanswered when the operator tells it to write go into `## Open questions`.
- R7. Each run creates exactly one new change directory, named as `naming.md` says, holding exactly one file, `intent.md`, written as `intent_template.md` says. It never overwrites or edits any other file. Where `naming.md` says to stop and ask (a new feature whose slug is taken, or a change slug that already exists in its feature), the skill stops and asks before creating anything (operator decision, 2026-11-06).
- R8. The intent's front matter has `origin: person`. The skill writes no other origin. When the operator says the work comes from a ticket, the skill keeps `origin: person` and cites the ticket in `## Problem` as evidence (operator decision, 2026-11-06). It may also list the ticket under `links`, or leave `links` out (operator decision, 2026-11-06).
- R9. `operator` is the operator's name from the session context. If the session does not have it, the skill asks for it. It never runs `git` to find it, and never takes it from git config, including the git user that Claude Code puts in the session context (operator decision, 2026-11-06).
- R10. After writing, the skill gives the operator the path of the new `intent.md`, asks them to review it and correct anything that is wrong, and stops. In the same session, it applies the operator's corrections to that `intent.md` and to no other file (operator decision, 2026-11-06).
- R11. The skill never creates `spec.md` or `plan.md`, never commits, and runs no `git` command.
- R12. The only shell command the skill runs is the timestamp command that `naming.md` names, `date +%Y%m%d-%H%M`. Its `allowed-tools` rule pre-approves exactly that command. The skill ships no scripts and needs nothing outside Claude Code and the project's `.specs/_rules/` at run time.
- R13. The skill is built under `policy-skill-authoring`, with eval cases in `evals/intent/<case>/` at the plugin root. Because it is command-only, its eval runs have no baseline and its description is not optimized.
- R14. The eval cases are these four (operator decision, 2026-11-06): a vague request, where the run asks analyst questions and writes nothing (R4, R6); a request that answers the analyst's questions and tells the skill to write, where the run writes one change directory and an `intent.md` that follows the template in the operator's terms (R6 to R9, R15); a request that contradicts the project, where the run names the contradiction (R4, R5); and work that belongs to an existing feature, where the run uses that feature's slug and cites the related change (R5, R7). Every case checks that nothing is committed and no spec or plan is written (R11). A project without `.specs/_rules/` (R2) is verified by hand instead (operator decision, 2026-11-06).
- R15. The skill sets `type`, `risk` and `spec` itself, following `intent_template.md`, without asking the operator. The operator corrects them at review (operator decision, 2026-11-06).

## Design
- **Skill (`skills/intent/SKILL.md`)** (R1, R3, R12). Front matter: `name: intent`, a `description` for the command list, `disable-model-invocation: true`, `argument-hint` for the optional description, and `allowed-tools: Bash(date +%Y%m%d-%H%M)`. The body is behavior only: the order of work below, and pointers to `${CLAUDE_PROJECT_DIR}/.specs/_rules/naming.md` and `intent_template.md` for everything about the directory and the document.
- **Order of work** (R2, R4 to R10, R15).
  1. Check that the two rule files exist (R2); stop if not.
  2. Read `naming.md` and `intent_template.md`.
  3. Take the operator's description from the arguments, or ask for it (R1).
  4. Read what in the project bears on it (R5): related code and docs, and the features and change directories in `.specs/`.
  5. Align (R4). Say back what Claude understood, name each gap or inconsistency it found with its evidence, and ask its questions a few at a time, in plain text, waiting for answers. Repeat until no question is left, or the operator says to write.
  6. Write (R6 to R9, R15). Run `date +%Y%m%d-%H%M`, create the change directory as `naming.md` says, stopping to ask where it says to, and write `intent.md` from the template with `agent: claude`, `origin: person`, the operator's name, and `type`, `risk` and `spec` chosen by the template's guidance.
  7. Hand over (R10). Give the path, ask for review and corrections, apply corrections to that file only, and stop.
- **Operator name** (R9). The skill does not say where in the session context the name is found, because operators supply it in different ways, for example a user file in their harness (operator decision, 2026-11-06). It does say that the git user in the session context does not count (R9). The eval cases give the name in the conversation.
- **Shipping** (R12). Nothing beyond `SKILL.md`. The timestamp comes from `date`, the rules from the project, and the file is written with the Write tool.
- **Evals (`evals/intent/`)** (R13, R14). Each case's `scaffold_script` builds a small fixture project in the run's workspace from the case's `files/`, copies the rules in from the plugin root at run time (`$(dirname "$0")/../../../.specs/_rules/`), and makes one git commit. Every case is a single prompt. The cases that end in a written intent give the operator's name, the request and their answers on scope, users, constraints and success in that one prompt, ending with the go-ahead to write; no conversation is recorded or resumed (operator decision, 2026-11-06). The back-and-forth of R4 is covered by the cases that ask questions and by the manual check. Every run passes `--ablation none`, so there is no baseline arm, as the command-only exemption allows.
- **Grading** (R14). The new intent's path holds a timestamp, and a file grader's `path` takes no glob (probed 2026-11-06), so graders judge the intent through its Write call: `tool_used` with `input_match` (a pattern over the JSON of the call's input) and `min`/`max` for its path, front matter, headings and citations, and for exactly one Write call, and `llm` with `focus: trace` for its wording. `file_exists`, which does take a glob, checks that the file landed in the run's workspace. In every case, `tool_used` graders with `max: 0` check that no Write targets a `spec.md` or `plan.md`, that no Bash command runs `git`, and that no Bash command other than `date +%Y%m%d-%H%M` runs (R11, R12). The hand-over is judged with `focus: last_message`. Runs get Write and the timestamp command through `--allow-tools Write Bash(date:*)`, because eval runs do not honor a skill's own `allowed-tools` rule. The form works when passed through `make evals ARGS=…` (probed 2026-11-06).
- **Policy scope** (R13). `SKILL.md` and the cases in `evals/intent/` are built through skill-creator's full workflow, invoked first. skill-creator's own runs cannot run a plugin's command in an isolated fixture project, so each iteration's with-skill runs are `claude plugin eval` runs of the cases. Each run's trace, final message and workspace files are copied into the skill-creator workspace, then graded, labelled and shown in its viewer (operator decision, 2026-11-06). The plugin has no other file for this skill.

## Out of scope / Deferred
- Deferred: reworking an intent written in an earlier session or by someone else (intent C6).
- Deferred: intents with `origin` `ticket`, `incident`, `scan` or `band` (intent C7).
- Checking or confirming how well the slugs are worded before writing. The skill does not handle poorly chosen slugs; the operator corrects them at review (operator decision, 2026-11-06). A slug that already exists is handled as `naming.md` says (R7).
- Running `scripts/lint-specs.sh` on the new intent. The skill relies on following the template; `make check` lints this repo's documents (operator decision, 2026-11-06).
- Committing, and writing `spec.md` or `plan.md` (intent C10).
- Using the skill on real work before it is released (intent C12). This spec and its plan are written by hand.

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. |
| C2 | R6. Running `/sdlc:intent` is the request to write. |
| C3 | R4. |
| C4 | R3. |
| C5 | R2. |
| C6 | R7, R10. |
| C7 | R8. |
| C8 | R9, R11. |
| C9 | R5. |
| C10 | R10, R11. |
| C11 | R12. |
| C12 | R13, R14. Evals run against the work-in-progress plugin with `--plugin-dir`; Out of scope / Deferred. |
| C13 | R13, R14. |

## Open questions from the intent
None.

## Areas of concern
None.
