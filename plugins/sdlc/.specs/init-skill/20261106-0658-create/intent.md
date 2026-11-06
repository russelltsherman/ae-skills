---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: create the init skill

## Problem
A project cannot adopt the `sdlc` plugin. The stage skills read their rules from the project's own `.specs/_rules/` (`ROADMAP.md` D3), and plugin hooks do nothing in a project that has not opted in (INTENT.md constraint 6). Today the only way to set up a project is to copy the rules by hand from the plugin, write an opt-in marker by hand, and tell Claude in `CLAUDE.md` that the project uses `sdlc`. Nothing does it for you, and nothing does it the same way twice.

`ROADMAP.md` makes this F4, minimal `init`, built by hand in Phase 0, with the plugin-and-project split proposed in D4. Later skills depend on it: `intent-skill/20261105-0958-create` C9 tells the operator to run `/sdlc:init` in a project without `.specs/_rules/`, and `spec-skill/20261105-1000-create` Q3 and `plan-skill/20261105-1001-create` Q3 ask the same question. The full `init` (every per-project file, plus migration on upgrade, D20) is a later component in Phase 7.

## Proposed outcome
A skill, `init`, in the `sdlc` plugin. In any project, the operator runs `/sdlc:init` and gets the planning rules in `.specs/_rules/`, an opt-in marker, and a short `sdlc` section in `.claude/CLAUDE.md`. It creates only what is missing, never overwrites anything, and reports what it created, what it added to and what it left alone. That is enough for the plugin's own repo to adopt the plugin, by running `/sdlc:init` in a session started in `plugins/sdlc` (operator decision, 2026-11-06). There, the rules and `.claude/CLAUDE.md` already exist, so it adds only the marker and the section.

## Affected users and systems
- Users: the operator of a project that adopts the `sdlc` plugin. Now that is the author alone, starting with this plugin's own repo.
- Systems: a new skill in `skills/init/` of the `sdlc` plugin; the plugin's canonical rules in `${CLAUDE_PLUGIN_ROOT}/.specs/_rules/`; the project's `.specs/_rules/`, `.claude/sdlc.md` and `.claude/CLAUDE.md`; the stage skills and hooks that check for the marker.

## Constraints
- C1. The skill is named `init` and is invoked only as `/sdlc:init`, because `/init` is a built-in. It is command-only (`disable-model-invocation: true`): Claude never starts it on its own.
- C2. It copies the rule files from `${CLAUDE_PLUGIN_ROOT}/.specs/_rules/` into `${CLAUDE_PROJECT_DIR}/.specs/_rules/` (D3).
- C3. The opt-in marker is `.claude/sdlc.md`, and it is committed with the project, so CI and hooks see it too. This replaces D4's `.claude/sdlc.local.md` (operator decision, 2026-11-06).
- C4. The marker records the `sdlc` plugin version that ran `init`.
- C5. The `sdlc` section always goes in `.claude/CLAUDE.md`, which `init` creates if it is missing. `init` never writes to a root `CLAUDE.md` (operator decision, 2026-11-06).
- C6. The section sits between `<!-- sdlc:begin -->` and `<!-- sdlc:end -->` lines. Nothing outside those lines is changed.
- C7. The section is only a pointer: it says the project uses `sdlc` and that its planning rules are in `.specs/_rules/`.
- C8. `init` never overwrites. It skips any rule file or marker that already exists, and any `.claude/CLAUDE.md` that already has the `sdlc` section. It creates the rest and lists what it created, what it updated and what it skipped (operator decision, 2026-11-06). Upgrading existing files waits for D20.
- C9. This change scaffolds only the rules, the marker and the `CLAUDE.md` section. `REVIEW.md`, `evals/`, example policy skills, the permission allowlist (D13) and migration (D20) come in later changes.
- C10. The operator commits what `init` writes. The skill never commits.
- C11. The skill ships in the plugin and needs nothing outside the harness at run time (INTENT.md constraint 7).
- C12. The skill is built and tested with `--plugin-dir`. This repo adopts the plugin only with a released version (INTENT.md constraint 4).
- C13. The skill is built under `policy-skill-authoring`, with its eval cases in `evals/init/` at the plugin root.

## Open questions
None.

## Action already taken
None.
