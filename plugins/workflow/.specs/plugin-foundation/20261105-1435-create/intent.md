---
agent: claude
operator: Russell Sherman
origin: person
type: chore
risk: routine
spec: skipped
---
# Intent: Create plugin-foundation

## Problem
The foundation of the `workflow` plugin was built by hand in Phase 0, and its pieces have drifted from the root intent. This is roadmap components F1 to F4 in `ROADMAP.md`, under decisions D1, D2, D7 and D9.

- **F1, plugin scaffold.** The plugin is described three different ways: `.claude-plugin/plugin.json` says "a collection of skills", the `workflow` entry in the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`) says "Skills for driving my personal workflow.", and `INTENT.md` describes skills for how I work with Claude in any project or session, plus repo-wide policies.
- **F2, project `CLAUDE.md`.** `.claude/CLAUDE.md` lists the commands but does not send Claude to the rules in `.specs/CLAUDE.md` before it creates, finds or edits anything under `.specs/`.
- **F3, root intent, roadmap and planning rules.** `INTENT.md`, `ROADMAP.md` and `.specs/_rules/` are in place as they stand.
- **F4, skill README template.** `docs/skills/README_TEMPLATE.md` was brought in line with D4 (cases in `evals/<skill>/`) and the `# Goal: Checks that ` goal line during alignment, by the operator, and needs no further change.

## Proposed outcome
The foundation that every other component stands on is accurate: the plugin is described the same way in its manifest and in the marketplace, and Claude reads the planning rules before touching `.specs/`.

## Affected users and systems
- Users: the author; later, anyone who finds the plugin in the `ae-skills` marketplace.
- Systems: `.claude-plugin/plugin.json`, the `ae-skills` marketplace manifest `../../.claude-plugin/marketplace.json`, `.claude/CLAUDE.md`, Claude Code's plugin and marketplace listing.

## Constraints
- C1. The `description` in `.claude-plugin/plugin.json` is exactly "Skills for how I work with Claude in any project or session, plus repo-wide policies."
- C2. The `description` of the `workflow` entry in `../../.claude-plugin/marketplace.json` is the same sentence as in C1.
- C3. The `keywords` in `.claude-plugin/plugin.json` stay as they are.
- C4. `.claude/CLAUDE.md` keeps its commands and tells Claude to read `.specs/CLAUDE.md` before touching anything under `.specs/`.
- C5. `INTENT.md`, `.specs/_rules/` and `docs/skills/README_TEMPLATE.md` are not changed (F3 and F4 stand as they are).
- C6. The plugin `README.md`, `TODO.md` and the `greet` skill (`skills/greet/`, `evals/greet/`) are not changed by this change.

## Open questions
None.

## Action already taken
None.
