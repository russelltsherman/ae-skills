---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: create the plugin foundation

## Problem
The `sdlc` plugin does not exist yet. No one can install it from the `ae-skills` marketplace. Claude has no project instructions for developing it. There is no single written statement of what the plugin is for or how its work is broken down. There are also no rules for naming or writing planning documents, so nothing can be planned the same way twice and no later tool can check a document.

`ROADMAP.md` makes this the foundation of Phase 0: F1 (plugin scaffold), F2 (project `CLAUDE.md`) and F3 (root intent, roadmap, artifact home and templates, settled in D1–D3). It is built by hand, because no part of the harness exists to build it with. Every later component (`init`, the check-target, the eval-target and the skills) is planned against the rules it sets down.

## Proposed outcome
- The `sdlc` plugin can be installed from the `ae-skills` marketplace, and the plugin and its marketplace entry describe it the same way.
- When Claude works in the plugin directory, it reads a short project `CLAUDE.md` that tells it how to develop the plugin.
- The repo holds a root intent, a roadmap, and the rules for planning documents. Every later change is planned in `.specs/` under those rules.

## Affected users and systems
- Users: the operator developing the `sdlc` plugin; Claude, working in the plugin directory; later, projects that receive copies of the planning rules through `init`.
- Systems: `.claude-plugin/plugin.json`; the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`); `.claude/CLAUDE.md`; `INTENT.md`; `ROADMAP.md`; `.specs/_rules/`; `claude plugin validate`.

## Constraints
- C1. The plugin is named `sdlc`, and its manifest is `.claude-plugin/plugin.json`.
- C2. The `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`) lists `sdlc` with the source `./plugins/sdlc`.
- C3. The manifest and the marketplace entry describe the plugin the same way.
- C4. `claude plugin validate --strict .` and `claude plugin validate --profile directory .` both exit 0 in the plugin directory.
- C5. The project `CLAUDE.md` is at `.claude/CLAUDE.md`, not at the plugin root, because a root `CLAUDE.md` fails strict validation (D22).
- C6. The project `CLAUDE.md` fits on one page and covers the commands for developing the plugin. It has no conventions or things-to-get-right sections.
- C7. The root intent is `INTENT.md` and the work breakdown is `ROADMAP.md`, both at the plugin root. The roadmap's D and F IDs are stable, so specs and plans can cite them.
- C8. Change directories are `.specs/<feature>/<YYYYMMDD-HHMM>-<change>/`, with kebab-case slugs. Names that start with `_` are reserved for rules (D1). The naming rule is `.specs/_rules/naming.md`.
- C9. Templates for `intent.md`, `spec.md` and `plan.md` are in `.specs/_rules/`. Front matter is flat `key: value` lines with no `status` key. A document is approved when the operator asks for the next one and it exists. Plan approval is a `Plan-Approved-By:` trailer on the first implementation commit. `C`, `Q`, `R` and `K` IDs are never renumbered (D2, D3).
- C10. `.specs/_rules/` in this repo is the canonical copy that `init` later ships to projects (D3).
- C11. The intents for `intent`, `spec` and `plan` are written in `.specs/` in the template format.
- C12. Development artifacts (`INTENT.md`, `ROADMAP.md`, `.specs/`, `refs/`) stay in `plugins/sdlc/` (D22).
- C13. `refs/` is never tracked and never ships in the plugin (INTENT.md constraint 9).
- C14. Everything in this change is written by hand; no part of the harness is used to build it.
- C15. The plugin's first version is `0.1.0`.
- C16. The plugin's description, in both the manifest and the marketplace entry, is "an implementation of Anthropics AI Native Software Development Lifecycle".
- C17. The plugin's author is Russell Sherman, with the URL `https://github.com/russelltsherman/ae-skills`.
- C18. The plugin's keywords are `skills`.

## Open questions
None.

## Action already taken
None.
