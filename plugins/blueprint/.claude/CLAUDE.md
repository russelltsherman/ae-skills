# blueprint plugin

This directory is the `blueprint` Claude Code plugin. It is also a `blueprint` project: the plugin is planned in its own documents.

<!-- blueprint:start -->
## Planning with blueprint

This project plans its work with the `blueprint` plugin.

- High-level design, in this directory: `SYSTEM.md`, `ARCHITECTURE.md`, `ROADMAP.md`, and decision records in `docs/adr/`. Work on it with `/hld`.
- Low-level design, one directory per component: `.blueprints/<component>/`, holding `INTENT.md`, `SPEC.md`, `PROOFS.md` and `PLAN.md`. Work on it with `/lld <component>`.
- Templates: `.blueprints/_rules/`. Every planning document follows its template there.
- Agents propose options with trade-offs. The operator decides.
<!-- blueprint:end -->

## Working on the plugin

- **Read the HLD first.** `SYSTEM.md`, `ARCHITECTURE.md`, `ROADMAP.md` and `docs/adr/` are the current design. `GLOSSARY.md` defines its terms. Changes to the plugin follow that design; a change that would cross it goes into the HLD first.
- **`.blueprints/_rules/` does two jobs.** It is this project's copy of the templates, and it is what the plugin ships: `init` copies it into other projects. Editing a template changes both.
- **Decision records are immutable once accepted.** Change only an accepted record's `status`. To change an accepted decision, write a new record that supersedes it.
- **IDs are permanent.** Never renumber or reuse an `SC`, `SQT`, `M`, `I` or `D`; mark an item withdrawn instead.
- **`refs/` is reference material, not design.** `refs/blueprint-hld.md` is the original draft, superseded by the HLD. Do not edit it or cite it as current.
- **Skills live in `skills/<name>/SKILL.md`.** They are drafts with no evals yet. A skill points to the templates for format and never restates them.
- **Checks.** `make check` and the lint are planned for roadmap phase 1 and do not exist yet. Until they do, check citations by hand: every cited ID must exist in this project and must not be withdrawn or superseded.
