---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: create the spec skill

## Problem
An approved `intent.md` cannot be turned into a `spec.md` except by hand. Today the operator has to point Claude at `.specs/_rules/spec_template.md`, remind it which policy skills apply, and check by eye that every constraint and open question from the intent was carried into the spec, that requirements are numbered and testable, and that no concern was settled without the operator. Nothing makes the agent challenge the intent before designing against it, and nothing does it the same way twice.

## Proposed outcome
A skill, `spec`, in the `sdlc` plugin. In a project set up by `init`, the operator asks for the spec of an approved intent, by running `/sdlc:spec`, and the skill:

- finds the change directory the way `.specs/_rules/naming.md` says;
- reads the intent critically, looks for gaps, contradictions and unchecked constraints, and asks the operator questions until they are aligned, writing what changes back into `intent.md`;
- finds the policy skills in the session (D10), loads those whose description covers the change, applies them, and raises any conflict between them, or between a skill and the intent, with the operator, writing it as a concern when the operator does not decide it;
- writes `spec.md` beside the intent, following the project's `spec_template.md`;
- stops for the operator to review it, and never writes the plan or commits.

## Affected users and systems
- Users: the operator of a project that uses `sdlc`. Now that is the author alone, starting with this plugin's own repo.
- Systems: a new skill in `skills/spec/` of the `sdlc` plugin; the project's `.specs/_rules/` (naming rule, spec template and intent template); `intent.md` and `spec.md` in a change directory; any `policy-*` skill in the session, from the project, the user or a plugin; the `plan` skill, which reads what `spec` writes.

## Constraints
- C1. The skill is named `spec` and is invoked as `/sdlc:spec`. It is command-only (`disable-model-invocation: true`): Claude never starts it on its own.
- C2. It writes `spec.md` only when the change directory has an `intent.md` whose `operator` is not `pending`, and only when the operator asks for it, as `.specs/_rules/spec_template.md` requires. An `operator` that is missing or empty counts as `pending` (operator decision, 2026-11-06).
- C3. It finds the change directory as `.specs/_rules/naming.md` says, and asks the operator when more than one matches.
- C4. It reads the naming rule and the spec template from `${CLAUDE_PROJECT_DIR}/.specs/_rules/`, and the intent template from there only when alignment changes the intent, and points to them; the skill does not restate their rules (operator decision, 2026-11-06).
- C5. Before writing, it thinks critically about the intent: it looks for gaps, inconsistencies and constraints that cannot be checked, and asks the operator questions until they are aligned.
- C6. It finds policy skills as D10 says: any skill in the session whose name starts with `policy-`. It applies those whose description covers the change and lists them in the spec's `skills:` key, or `none`. When alignment changes the intent, it matches the descriptions again and applies any policy skill that now covers the change before writing (operator decision, 2026-11-06).
- C7. A conflict between two policy skills, or between a policy skill and the intent, is raised with the operator during alignment. A conflict the operator decides is recorded as their decision; one they do not decide is written as a concern in `## Areas of concern` with a proposed option. The skill never resolves it itself (operator decision, 2026-11-06).
- C8. It records as decided only what the operator decided. A question or concern the operator has not answered stays open.
- C9. It never creates `plan.md` and never commits.
- C10. In a project without `.specs/_rules/`, it writes nothing and tells the operator to run `/sdlc:init`.
- C11. The skill ships in the plugin and needs nothing outside the harness at run time (INTENT.md constraint 7).
- C12. The skill is built and tested with `--plugin-dir`; it is used on real work only from a released version (INTENT.md constraint 4).
- C13. The skill is built under `policy-skill-authoring`, with its eval cases in `evals/spec/` at the plugin root.
- C14. Withdrawn: it contradicted C1; the skill is command-only (operator decision, 2026-11-06). Was: The skill is model-invocable: Claude may start it when the operator asks for a spec in plain words, not only through `/sdlc:spec` (operator decision, 2026-11-06).
- C15. The skill only creates `spec.md`. When the change directory already has one, it writes nothing and says so; reworking a spec is out of scope for this change (operator decision, 2026-11-06).
- C16. When the intent says `spec: skipped`, the skill writes nothing and points the operator to `plan` (operator decision, 2026-11-06).
- C17. Withdrawn: the skill does not check whether the intent is committed, so it does not tell the operator how to commit an intent change; C19 replaces it (operator decision, 2026-11-06). Was: When alignment changes the intent (a new or changed constraint, an answered question), the skill edits `intent.md` itself, following the intent template's rules for changing an intent (operator decision, 2026-11-06). When the intent is already committed, it still edits it and tells the operator the change must be committed with a message that says why (operator decision, 2026-11-06).
- C18. To apply a policy skill, the skill invokes it through the Skill tool so its full text loads; its description only decides whether it covers the change (operator decision, 2026-11-06).
- C19. When alignment changes the intent (a new or changed constraint, an answered question), the skill edits `intent.md` itself, following the intent template's rules for changing an intent. It does not check whether the intent is committed; committing the change, and the commit message, are left to the operator (operator decision, 2026-11-06).

## Open questions
None.

## Action already taken
None.
