# Intent: sdlc, a Claude Code plugin for the AI-native SDLC playbook

Author: Russell Sherman.
Source: Anthropic's *AI-native SDLC playbook* (local mirror in `refs/ai-native-sdlc-playbook/`; the course text wins where it disagrees with the article).

This is the root intent for the whole project. Every change below it is planned in `.specs/`, following the naming rule and templates in `.specs/_rules/` (see C11). The work breakdown (foundation, check-target, eval-target, the components and skills built on them, design decisions and phases) is in [`ROADMAP.md`](ROADMAP.md).

## Problem

The playbook describes twelve plays across six stages (Plan, Design, Build, Test, Deploy, Maintain). It explains what to do but ships nothing to run. Following it today means hand-assembling a `CLAUDE.md`, skills, subagents, hooks, templates, evals and CI workflows per project, and remembering the artifact chain (`intent.md` → `spec.md` → `plan.md` → code → review → release → monitoring → new `intent.md`) by discipline alone.

The playbook is also written for large, regulated organizations with separate product owners, tech leads, release managers and platform teams. A solo developer plays all of those roles. Nothing shows how the plays collapse to one person while keeping the gates meaningful.

## Proposed outcome

A Claude Code plugin, `sdlc`, published in the `ae-skills` marketplace, that a solo developer installs into a project so that following the playbook is the path of least resistance:

- Each stage has a skill that produces or consumes the stage's artifact.
- Artifacts live in the project repo under `.specs/<feature>/<YYYYMMDD-HHMM>-<change>/`, versioned and linked to each other: the spec cites the intent's constraint (`C`) and question (`Q`) IDs, and the plan and the review cite the spec's requirement (`R`) IDs.
- The deterministic layer (hooks, checks, evals) backs the advisory layer (skills, `CLAUDE.md`) wherever a rule must hold.
- One command, `make check`, verifies the harness without any model calls.
- A separate command, `make evals`, runs the skills' eval cases, either for every skill or for one.
- `init` scaffolds what a project owns (its `CLAUDE.md` section, `REVIEW.md`, `.specs/` with its `_rules/`, `evals/`, the opt-in marker); everything else ships in the plugin.
- The harness is built with itself. From the moment a component is released, it is used to build the next one.

## Affected users and systems

- **Now:** one solo developer (the author), acting as originator, product owner, engineer, reviewer and release manager.
- **Later:** other Claude Code users who install the plugin.
- **Systems:** Claude Code (plugins and marketplaces, skills, subagents, hooks, settings, plan mode, auto mode, `claude -p`), Git, GitHub (`gh`, Actions, branch protection).

## Constraints

1. **Solo developer first.** Enterprise-only controls (managed settings via MDM, `allowManagedHooksOnly`, change-ticket systems, Claude Tag, Claude Security scans) are out of scope. Where a play depends on one, the plugin keeps the shape of the control in a form one person can run, or defers it with a note.
2. **Gates survive role collapse.** One person approves everything, but each approval is still an explicit act by the operator, recorded in the repo the way `.specs/_rules/` defines it: asking for the next document approves the one before, and that document's existence is the record; the first implementation commit carries a `Plan-Approved-By:` trailer. No document is ever created unless the operator asks for it.
3. **Skill naming.** Every skill is one lowercase word with no separator: `intent`, `spec`, `plan`. Commands follow the same names. The plugin namespace (`sdlc:`) keeps them grouped and prevents collisions; where a name matches a built-in (`/init`, `/review`, `/status`), the skill is invoked by its qualified name, such as `/sdlc:init`.
4. **Dogfooding is the build order.** Components are built in the order of the playbook's dependency graph, so each new component is specified, planned and reviewed with the components that already exist. A component exists once it is in a released plugin version; work in progress is tested with `--plugin-dir`, never used to build itself. Nothing is built by hand that the harness could already produce.
5. **Start small.** Each phase ends with something usable on real work. No component is designed in detail until its phase starts.
6. **Plugin and project stay separate.** Harness files ship in the plugin and are referenced through `${CLAUDE_PLUGIN_ROOT}`. Anything a project owns or customizes is scaffolded into it by `init` and referenced through `${CLAUDE_PROJECT_DIR}`. Plugin hooks do nothing in a project that has not opted in.
7. **No runtime dependency outside the harness.** Installed plugins and skills (for example `skill-creator`) are fine as build-time tools but nothing the plugin ships may require them.
8. **Minimal toolchain.** Scripts depend only on what a developer machine already has (shell, `git`, `jq`, `gh`), plus whatever D7 settles on.
9. **The playbook mirror is not redistributed.** `refs/` is © Anthropic and marked "don't redistribute". It stays untracked (ignored by its own `refs/.gitignore`) and never ships in the plugin.
10. **Prior work is ignored.** Git history and change directories written before this intent are not inputs to it. The rules in `.specs/_rules/` are.
11. **`.specs/_rules/` governs planning documents.** Change directories are named by `.specs/_rules/naming.md`, and each `intent.md`, `spec.md` and `plan.md` follows its template there. Where the rules depart from the playbook (for example, no `Status:` line, `<feature>/<YYYYMMDD-HHMM>-<change>` directories instead of `intent/<date>-<slug>`), the rules win. Changes to the rules are themselves changes under the feature `specs-rules`.
12. **Evals stay out of `make check`.** Evals are real, billed model runs, so they have their own target, `make evals`, and `make check` stays free.

## Open questions

- Q1. Once `plan` exists, does `ROADMAP.md` stay hand-maintained, or is it replaced by a `plan.md` the harness produces for this intent?
- Q2. Does work go through GitHub pull requests from Phase 1, or only from Phase 3 when review arrives?
- Q3. Which real project, outside this monorepo, will prove the plugin before it is offered to other users?
