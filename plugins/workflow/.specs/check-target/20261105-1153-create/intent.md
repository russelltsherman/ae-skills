---
agent: claude
operator: Russell Sherman
origin: person
type: chore
risk: routine
spec: required
---
# Intent: Create check-target

## Problem
Nothing verifies the `workflow` plugin before a change is called done. The validate commands, `shellcheck`, and the rules for skill READMEs (`docs/skills/README_TEMPLATE.md`) and eval cases are checked by hand, if at all, so a broken manifest, a failing script, a README that drifts from its skill's test cases, or an eval case `claude plugin eval` cannot run goes unnoticed. `claude plugin eval` has no option that checks cases without running them.

This is roadmap component F5, under decisions D3 and D5 in `ROADMAP.md`, and root intent constraints 3 and 7 in `INTENT.md`.

## Proposed outcome
One command, `make check`, run in the plugin directory, verifies the plugin: both validate commands, `shellcheck` on every shell script, and lints of the skill READMEs and eval cases. It reports every failure it finds and exits non-zero when any check fails. It costs nothing to run: it makes no model calls.

## Affected users and systems
- Users: the author, before calling any change to the plugin done.
- Systems: the plugin directory `plugins/workflow/` (a new `make check` target and the lint scripts it runs), `claude plugin validate`, `shellcheck`, `jq`, the skill READMEs in `docs/skills/`, and the eval cases in `evals/`.

## Constraints
- C1. `make check`, run in the plugin directory, is the one command that verifies the plugin.
- C2. It runs `claude plugin validate --strict .`.
- C3. It runs `claude plugin validate --profile directory .`.
- C4. It runs `shellcheck` on every `.sh` file in the plugin directory, except those under a `*-workspace/` or `results/` folder.
- C5. It runs a lint of each skill README (C12, C13).
- C6. It runs a lint of each eval case folder (C14, C15).
- C7. It does not lint `.specs/`.
- C8. It does not run evals and makes no model calls.
- C9. The lints are workflow's own, not shared with sdlc.
- C10. Scripts are Bash and `jq`, with Python stdlib only where Bash gets unreadable.
- C11. The lints check the target layout only: eval cases in `evals/<skill>/<case>/` and READMEs at `docs/skills/<skill>/README.md`. The old `skills/<skill>/evals/` layout is not accepted.
- C12. Every skill in `skills/` has a README at `docs/skills/<skill>/README.md`; a skill without one fails the README lint.
- C13. The README lint checks, for each README: the `# <skill>` title line; the link to the skill's `SKILL.md`; the `##` headings of `docs/skills/README_TEMPLATE.md`, with their exact names and in their order, where only `Details` and `Limits` may be left out; and a Test cases table that lists exactly the case folders in `evals/<skill>/`, each with its goal copied word for word from line 1 of the case's `case.yaml`, without the `# Goal: ` prefix.
- C14. The eval case lint checks, for each `evals/<skill>/<case>/`: line 1 of `case.yaml` starts with `# Goal: Checks that`; its `name:` matches the folder name; `prompt.md` exists; `graders/` holds at least one `.md` file; and every file named under `context:` in `case.yaml` exists in the case folder. Every folder in `evals/` matches a skill in `skills/`.
- C15. A skill in `skills/` with no eval cases in `evals/<skill>/` fails the eval case lint.
- C16. `make check` runs every check even when an earlier one fails, reports each failure, and exits non-zero when any check failed.
- C17. When `claude`, `shellcheck` or `jq` is not installed, `make check` fails with a message naming the missing tool.

## Open questions
None.

## Action already taken
None.
