---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: create the plan skill

## Problem
An approved `spec.md`, or an intent with `spec: skipped`, can be turned into a `plan.md` only by hand. Today the operator has to point Claude at `.specs/_rules/plan_template.md`, check that the plan may be written yet (no open concerns in the spec, no open questions in a skipped-spec intent), and check by eye that every requirement is in `## Order of work` and `## Proof`, that `## Files that change` is exact, and that a fix starts with a failing test. Proof items are not checked against the real tools, so a plan can name commands, flags or targets that do not exist. Nothing makes the agent question the operator about the change before planning it, and nothing does it the same way twice.

Built-in plan mode does not fill the gap. It writes its plan to its own file, not to the change directory, and accepting the plan through `ExitPlanMode` starts implementation, which the planning rules forbid until the operator asks for it (`ROADMAP.md` D9).

## Proposed outcome
A skill, `plan`, in the `sdlc` plugin. In a project set up by `init`, the operator runs `/sdlc:plan` and the skill:

- finds the change directory the way `.specs/_rules/naming.md` says;
- checks that a plan may be written, from the spec or from an intent with `spec: skipped`;
- reads the intent, the spec and the codebase, and asks the operator the questions they leave open until the two are aligned;
- writes `plan.md` from the project's `plan_template.md`, or reworks the one that is there, after checking each Proof item against the real tool;
- iterates on the operator's corrections until someone who never saw the session could implement the change from the plan alone;
- stops for the operator to review it, and never edits code, starts implementation or commits.

## Affected users and systems
- Users: the operator of a project that uses `sdlc`. Now that is the author alone, starting with this plugin's own repo.
- Systems: a new skill in `skills/plan/` of the `sdlc` plugin; the project's `.specs/_rules/` (naming rule and plan template); `intent.md`, `spec.md` and `plan.md` in a change directory; the project's codebase and the tools its Proof items name; Claude Code's built-in plan mode, which the skill does not use; the `spec` skill, whose output it reads, and the later `build` skill, which reads what it writes.

## Constraints
- C1. The skill is named `plan` and is invoked only as `/sdlc:plan`. It is command-only (`disable-model-invocation: true`): Claude never starts it on its own.
- C2. It runs outside built-in plan mode and uses neither plan mode's plan file nor `ExitPlanMode`, so accepting a plan never starts implementation (D9).
- C3. It writes `plan.md` only when the operator asks for it and the change directory meets the conditions in `.specs/_rules/plan_template.md`: a `spec.md` whose `## Areas of concern` is `None.`, or an `intent.md` with `spec: skipped` and no open questions.
- C4. It finds the change directory as `.specs/_rules/naming.md` says, and asks the operator when more than one matches.
- C5. It reads the naming rule and the plan template from `${CLAUDE_PROJECT_DIR}/.specs/_rules/` and points to them; the skill does not restate their rules.
- C6. It creates `plan.md`, or reworks the `plan.md` already in the change directory.
- C7. Before drafting, it reads the intent, the spec and the codebase, then asks the operator the questions they leave open until they are aligned. Only then does it write `plan.md`, and it iterates on the operator's corrections (operator decision, 2026-11-06).
- C8. Before writing a Proof item, it confirms against the real tool that each command, flag, make target and test path it names exists, using only checks with no model calls and no billed runs (operator decision, 2026-11-06).
- C9. It records as decided only what the operator decided. A question the operator has not answered stays open.
- C10. It never edits code, never starts implementation and never commits.
- C11. In a project without `.specs/_rules/`, it writes nothing and tells the operator to run `/sdlc:init`.
- C12. The skill ships in the plugin and needs nothing outside the harness at run time (INTENT.md constraint 7).
- C13. The skill is built and tested with `--plugin-dir`; it is used on real work only from a released version (INTENT.md constraint 4).
- C14. The skill is built under `policy-skill-authoring`, with its eval cases in `evals/plan/` at the plugin root.
- C15. This change's `spec.md` is written by hand, without waiting for a released `spec` skill, so `plan` can be built alongside `spec` (operator decision, 2026-11-06).
- C16. When alignment changes the spec or the intent (a new requirement, a settled question), the skill edits `spec.md` or `intent.md` itself, following each template's rules for changing that document (operator decision, 2026-11-06).
- C17. It reworks `plan.md` whenever the operator asks, including after implementation under it has started (operator decision, 2026-11-06).

## Open questions
None.

## Action already taken
None.
