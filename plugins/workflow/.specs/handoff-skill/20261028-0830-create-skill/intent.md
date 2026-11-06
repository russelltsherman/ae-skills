---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: Create handoff skill

## Problem
A thinking session has no clean way to pass what was worked out on to the next step or another agent. A skill isn't a separate session: when the next step runs in the same conversation, it sees every earlier message, regardless of what is passed to it directly. So the next step either works from the raw conversation, where Claude's suggestions sit alongside the user's decisions with equal weight, or it picks up a discussion the user considered closed. The conversation can also be long. When the harness compacts it automatically, it keeps what it chooses, not what the next step needs: who raised an idea, whether the user accepted it, and the dead ends can all be lost.

An earlier draft of this skill was built and its evals were reviewed on 2026-10-30 (see `policy-skill-authoring/20261027-0830-create-skill`). That draft was discarded; this change starts from nothing.

## Proposed outcome
A new `/handoff` skill. When called, it summarises the current session and writes a temporary file to `.handoff/<timestamp>-<slug>.md` with the session context. The timestamp includes both date and time (e.g. `20261028-1432`). It finishes by telling the user the summary file's path and advising them to clear the session before passing the handoff to the next step.

The summary:
- places more weight on the user's messages, but uses the agent's best reasoning to preserve the strongest ideas of the discussion, whoever raised them;
- attributes ideas: who raised each one, and whether the user accepted, rejected or never responded to it;
- records where an idea ended up, not just where it started, including constraints and dead ends found along the way (e.g. the agent can't run `/clear`, so the user has to);
- is neutral about the next step, because `/handoff` can never be certain what it is. The file names no next step. The closing message in chat can suggest a likely next step as an example, with the handoff file passed as its input.

If the session has nothing worth handing off, `/handoff` writes nothing and says so in one line.

## Affected users and systems
- Users: anyone who has thought something through in a session and wants to carry it into a fresh one, typically from an open-ended discussion to writing down what was decided.
- Systems: a new skill in `skills/handoff/`, its eval cases in `evals/handoff/`, and its documentation at `plugins/workflow/docs/skills/handoff/README.md` from the repo root. It relies on the plugin's `init` skill (`/workflow:init`, ROADMAP S2), which creates `.handoff/.gitignore`.

## Constraints
- C1. The contents of `.handoff/` are gitignored. Handoff files are temporary, and cleaning them up is the user's job; no skill deletes them.
- C2. The agent can't run `/clear`. `/handoff` stops after writing the file and telling the user what to run.
- C3. Calling `/handoff` is itself the explicit request to create the file; no further confirmation is asked for.
- C4. Built under the repo's skill-authoring policy.
- C5. No runtime dependency outside the repo.
- C6. `/handoff` creates or modifies no file outside `.handoff/`. In particular, it never edits the project's own `.gitignore`.
- C7. The skill starts only when the user runs `/handoff`. It is never invoked by the model.
- C8. Every handoff file has the same fixed sections, so other skills can rely on them. At least: decisions (what was accepted and what was rejected, each with its reason), open questions (including requests that were declined during the session), and dead ends and constraints found along the way. The spec sets the exact headings.
- C9. Secrets pasted into the session (keys, tokens, passwords and the like) are never written to the handoff file. Where one was left out, the file says so.
- C10. `/handoff` takes an optional free-text focus argument. When given, the handoff covers that focus, and the slug is taken from it.
- C11. The `.handoff/` used is the one at the git root when the session is inside a git repository, otherwise the one in the current directory.
- C12. Claude picks the slug: short kebab-case, from the focus argument if given, otherwise from the session's topic. An existing handoff file is never overwritten; if the name is taken, a numeric suffix is added.
- C13. When there is nothing to hand off, no file or directory is created, and the user is told in one line that there was nothing to hand off.
- C14. The skill is documented in a `README.md` at `plugins/workflow/docs/skills/handoff/` from the repo root, following the skill README template at `plugins/workflow/docs/skills/README_TEMPLATE.md`.
- C15. `/handoff` never creates or changes `.handoff/.gitignore`; `init` owns it (root INTENT constraint 8, ROADMAP D6). When it is missing, `/handoff` creates no file or directory and tells the user in one line to run `/workflow:init`. This check comes before the check for whether there is anything to hand off. A `.handoff/.gitignore` with any content counts as present.

## Open questions
None.

## Action already taken
None.
