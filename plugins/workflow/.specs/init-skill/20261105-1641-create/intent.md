---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: routine
spec: required
---
# Intent: Create init skill

## Problem
Some workflow skills write files into the project they run in, and a project has to be prepared for them first. Today nothing prepares it. `/handoff` writes its files to `.handoff/`, and those files must never be committed. `/handoff` won't create `.handoff/.gitignore` itself; when the file is missing it writes nothing and tells the user to run `/workflow:init` (`handoff-skill/20261028-0830-create-skill` C15, R6). That command doesn't exist yet, so `/handoff` can't be used in any project.

This is roadmap component S2, under decision D6 in `ROADMAP.md`, and root intent constraints 1, 4 and 8 in `INTENT.md`.

## Proposed outcome
A new `/workflow:init` skill. When the user runs it in a project, it creates `.handoff/.gitignore`, in the same place `/handoff` looks for it, so `/handoff` can be used there and nothing in `.handoff/` is ever committed. Running it again is always safe: an existing file is left as it is. It ends with a one-line reply saying what it did.

## Affected users and systems
- Users: anyone who wants to use `/handoff` in a project, starting with the author.
- Systems: a new skill in `skills/init/`, its eval cases in `evals/init/`, and its documentation at `docs/skills/init/README.md` in the plugin directory. The `/handoff` skill depends on the file this skill creates. Git, for finding the repository root.

## Constraints
- C1. The skill is invoked as `/workflow:init`. Its name, `init`, matches a built-in command, so it is called by its qualified name (root intent constraint 1).
- C2. It starts only when the user runs it, never when the model decides to (`disable-model-invocation: true`). Running it is itself the request, so it asks for no confirmation.
- C3. It creates `.handoff/.gitignore` at the git root when the current directory is inside a git repository, and in the current directory otherwise. This is the same place `/handoff` looks (`handoff-skill/20261028-0830-create-skill` R5).
- C4. A `.handoff/.gitignore` it creates contains `*`.
- C5. When `.handoff/.gitignore` already exists, with any content, it is not changed. The reply says it was already there.
- C6. It creates or changes no file or directory other than `.handoff/` and `.handoff/.gitignore`. In particular, it never edits the project's own `.gitignore`.
- C7. It takes no arguments. Text after the command is ignored and changes nothing.
- C8. It has no interaction with sdlc: it doesn't call, detect or depend on `/sdlc:init` or any other sdlc file.
- C9. When `.handoff/.gitignore` can't be created (for example, `.handoff` exists as a regular file, or the directory can't be written to), it creates, moves and deletes nothing, and says in one line what is in the way.
- C10. Its reply is one line: whether it created `.handoff/.gitignore` or found it already there, with the path.
- C11. It is built under the repo's skill-authoring policy (root intent constraint 2).
- C12. It needs nothing outside the plugin at run time (root intent constraint 3).
- C13. It is documented in `docs/skills/init/README.md` in the plugin directory, following `docs/skills/README_TEMPLATE.md` (ROADMAP D9).

## Open questions
None.

## Action already taken
None.
