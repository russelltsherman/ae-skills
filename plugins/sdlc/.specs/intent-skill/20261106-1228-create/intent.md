---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: create the intent skill

## Problem
The first stage of the playbook, Capture Intent, has no skill in the `sdlc` plugin. Today an operator who has an idea writes `intent.md` by hand, or asks Claude in a plain session to write one. Either way, the critical thinking and the questions an analyst would ask (scope, users, constraints, what success looks like) happen only if someone remembers to do them, and the result follows `.specs/_rules/naming.md` and `intent_template.md` only if the person or agent reads them first. Every intent in this repo so far, including this one, was written that way.

## Proposed outcome
A skill, `intent`, in the `sdlc` plugin. When the operator describes something they want, the skill makes Claude think critically about it: test it against the project, find gaps and inconsistencies, and ask the operator questions until the problem, outcome and constraints are clear. When the operator asks for it, it creates a new change directory and writes `intent.md` in the operator's terms, following the project's rules. Then it stops, so the operator can correct the intent before committing it.

## Affected users and systems
- Users: the operator of a project that uses the `sdlc` plugin. Now that is the author alone, starting with this plugin's own repo.
- Systems: a new skill in `skills/intent/` of the `sdlc` plugin; the project's `.specs/_rules/` (read) and `.specs/` (a new change directory written); `spec`, which reads the `intent.md` it writes; `evals/intent/` at the plugin root.

## Constraints
- C1. The skill is named `intent` and is invoked as `/sdlc:intent`. It is command-only (`disable-model-invocation: true`): Claude never starts it on its own (operator decision, 2026-11-06).
- C2. Nothing is written until the operator asks for it. Running `/sdlc:intent` counts as asking (operator decision, 2026-11-06).
- C3. The skill makes Claude think critically about what the operator wants: look for gaps and inconsistencies, and ask the analyst's questions (scope, users, constraints, what success looks like) until the operator and Claude are aligned.
- C4. The skill points to `.specs/_rules/naming.md` and `intent_template.md` for the directory name and the document's format and rules. It does not restate them.
- C5. The skill reads the rules only from the project's own `.specs/_rules/` (D3). If that folder is missing, it writes nothing and tells the operator to run `/sdlc:init` first (operator decision, 2026-11-06).
- C6. The skill only creates: each run writes one new change directory with one `intent.md`. Reworking an existing intent is a later change (operator decision, 2026-11-06). Applying the operator's corrections, in the same session, to the `intent.md` it just wrote is not reworking (operator decision, 2026-11-06).
- C7. The skill handles only `origin: person`. Intents from tickets, incidents, scans and bands come with later components (operator decision, 2026-11-06).
- C8. The `operator` value is the user's name from the session context. If the session does not have it, the skill asks. It never runs `git` to find it, and never takes it from git config, including the git user that Claude Code puts in the session context (operator decision, 2026-11-06).
- C9. The skill may read the project (code, docs, existing change directories) to test what the operator says, find gaps, and find related changes to cite. It records the problem, outcome and constraints in the operator's terms and designs nothing (operator decision, 2026-11-06).
- C10. After writing `intent.md`, the skill gives the operator its path, asks them to correct it, and stops (operator decision, 2026-11-06). It never commits, and never creates `spec.md` or `plan.md`.
- C11. The skill ships in the plugin and needs nothing outside the harness at run time (INTENT.md constraint 7).
- C12. The skill is built and tested with `--plugin-dir`. This intent, and the spec and plan that follow it, are written by hand; the skill is used for real work only from a released version (INTENT.md constraint 4).
- C13. The skill is built under `policy-skill-authoring`, with its eval cases in `evals/intent/` at the plugin root.

## Open questions
None.

## Action already taken
None.
