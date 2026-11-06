---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: Create check-target

## Problem
Nothing verifies the harness in one step. Today, checking that the plugin is sound means remembering to run `claude plugin validate` twice with different flags, and checking by eye that every `intent.md`, `spec.md` and `plan.md` in `.specs/` follows its template. Nothing catches a document with a missing section or an unknown front-matter key, or a shell script with a bug.

`ROADMAP.md` makes this F5, built by hand in Phase 0, with its contents settled in D6. It is the feedback loop every later component is built against.

## Proposed outcome
One command, `make check`, run from the plugin directory, that exits 0 when the harness is sound and non-zero, naming each problem, when it is not.

## Affected users and systems
- Users: the operator developing the `sdlc` plugin; Claude, which runs the check before calling a change done.
- Systems: a new `Makefile` in the plugin directory; a lint script in `scripts/` and its tests; `.claude/CLAUDE.md`; `.gitignore`, which decides which shell scripts are checked; `claude plugin validate`; `shellcheck`; `bats`; every planning document and change directory in `.specs/`.

## Constraints
- C1. The command is `make check`, run from the plugin directory.
- C2. It runs `claude plugin validate --strict .`, failing on its warnings.
- C3. It runs `claude plugin validate --profile directory .` without `--strict`, so listing problems (such as a short README) fail and listing warnings (such as a missing icon) do not, until Phase 7.
- C4. It runs `shellcheck` on every file in the plugin that git does not ignore (tracked, or untracked and not ignored) whose name ends in `.sh` or whose first line is a `sh` or `bash` shebang. `refs/` and `skills/*-workspace/` are left out because `.gitignore` ignores them.
- C5. It lints every `intent.md`, `spec.md` and `plan.md` in a change directory under `.specs/` against its template in `.specs/_rules/`: front-matter keys and required section headings.
- C6. Scripts are Bash and `jq`, with Python stdlib only where Bash gets unreadable (D7). It depends on nothing beyond `make`, the shell, `git`, `jq`, `gh`, `shellcheck`, `bats` and `claude`.
- C7. Hook tests and evals are not part of this change; they join `make check` when they exist.
- C8. The document lint lives in the plugin under `scripts/`, and only the plugin's own `make check`, from the `Makefile` in the plugin directory, runs it. Running it in other projects, from hooks or skills, is deferred.
- C9. The lint checks front-matter keys (required and unknown) and their allowed values, required section headings in order, and cross-document IDs: every intent `C` and `Q` ID appears exactly once in the spec, and every spec `R` ID that is not withdrawn appears in the plan's `## Order of work` and `## Proof`.
- C10. The lint hard-codes the keys, values and headings it checks. A test fails when they no longer match the tables in `.specs/_rules/*_template.md`, and `make check` runs that test.
- C11. `make check` runs every step, reports every failure, and exits non-zero if any step failed.
- C12. `shellcheck` is required: if it is not installed, `make check` fails.
- C13. The lint checks ID and title hygiene: every `C`, `Q`, `R` and `K` bullet uses its template's format (`- C1. <text>`), no ID appears twice in its list, a withdrawn entry reads `Withdrawn: <reason>. Was: <original text>.`, and the titles in `# Spec: <title>` and `# Plan: <title>` match the intent's `# Intent: <title>`.
- C14. The lint checks change-directory names against `.specs/_rules/naming.md`: `<feature>` and `<change>` are slugs using only `a-z`, `0-9` and `-`, and the timestamp is a valid `YYYYMMDD-HHMM`. Names starting with `_` are skipped.
- C15. `make check` is listed under Commands in `.claude/CLAUDE.md`, replacing the two `claude plugin validate` commands there.
- C16. `make check` makes no model calls and never runs evals.
- C17. Every tool it uses is required: if `git`, `jq`, `bats` or `claude` is not installed, `make check` fails and names the missing tool, as C12 does for `shellcheck`.
- C18. The lint has behavior tests written in `bats`, in addition to C10's test, and `make check` runs them.

## Open questions
None.

## Action already taken
None.
