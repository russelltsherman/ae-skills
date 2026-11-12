# blueprint

Guided high-level and low-level design for coding agents. `blueprint` takes a project from a system intent, through its architecture and decisions, down to a plan for each change to each component, with every document in plain Markdown in your repository and every document citing the level above it.

The agent works as an expert architect and analyst. It reads what you have, finds gaps and contradictions, interviews you until each one is settled, and only then writes, following templates your project owns. It proposes options with trade-offs; you make every decision.

> **Status: early.** The skills are drafts without evals yet, and the lint and `make check` described below are planned but not built. See [ROADMAP.md](ROADMAP.md).

## Install

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install blueprint@ae-skills
```

For pattern-aware architecture work, also install the [`patterns`](../patterns/) plugin.

## Quick start

From the root of your project:

1. `/blueprint:init` sets the project up: copies the templates into `.blueprints/_rules/` and adds a short section to `.claude/CLAUDE.md`.
2. `/blueprint:hld` works on the high-level design. Give it a focus, or nothing to review everything:
   ```
   /blueprint:hld how should the notifier talk to the order service?
   ```
3. `/blueprint:lld <component>` works on one component's low-level design:
   ```
   /blueprint:lld M3 plan the retry change
   ```

There is no required order. Start any document, work on several side by side, leave them incomplete, and move between levels as you go.

## The skills

| Skill | What it does |
| --- | --- |
| `init` | Scaffolds a project. Safe to re-run: never overwrites a template or `.claude/CLAUDE.md` section you changed without asking. Recognizes a project nested inside another. |
| `hld` | Expert architect for the whole system: constraints, quality targets, components, contracts, data ownership, decisions and the roadmap. Stays high level. |
| `lld` | Expert architect and analyst for one component, grounded in the code as it is: intent, requirements, internal design, proofs, and the plan for one change. Goes deep. |

All three are commands only; the model never starts them on its own. `hld` and `lld` follow the same four steps every run:

1. **Read** the documents at their level, the level above, and the code.
2. **Review** for gaps, contradictions, open questions and anything written at the wrong level, and list the issues before asking anything.
3. **Interview** you one issue at a time, with real options, their trade-offs and the simplest workable option.
4. **Write what is agreed.** Anything unsettled is recorded as an open question or concern, never guessed.

## The documents

```text
<project>/
  SYSTEM.md            # system intent: constraints SC, quality targets SQT
  ARCHITECTURE.md      # components M, contracts I, data ownership, patterns
  ROADMAP.md           # components grouped by phase
  docs/adr/
    0001-<slug>.md     # one decision record per significant choice: D1
  .blueprints/
    _rules/            # your project's templates, one per document type
    <component>/
      INTENT.md        # component constraints C, quality targets QT
      SPEC.md          # requirements R and the design inside the component
      PROOFS.md        # the proof for each requirement
      PLAN.md          # one change at a time
```

- **Living documents.** Everything except decision records and the plan describes the current state and is edited as the system changes; git keeps the history.
- **Decision records** use the MADR format and statuses. Once accepted, only their status changes; a new record supersedes an old one, so the records form a chain of how each choice changed and why.
- **The plan** covers one change. Its last two steps write the lasting lessons into the living documents and then mark the plan `completed`, and the next plan replaces it.
- **IDs are permanent.** Each level has its own prefixes (HLD: `SC SQT M I D`, LLD: `C QT R`), so a citation shows its level at a glance. Items are withdrawn, never renumbered.

## Keeping the levels honest

- **The boundary rule.** A component design crosses into the HLD if it adds, removes or splits a component, changes a contract, moves data ownership, changes a quality target, or contradicts an accepted decision. `lld` flags a crossing, names the HLD change it needs and keeps it out of the LLD; you take it to `hld` when you choose.
- **Against over-engineering.** Every significant decision lists the simplest workable option. An option is chosen for a stated target, never for being common, and `hld` asks for a number for every quality target.
- **Pattern skills.** With the `patterns` plugin installed, `hld` draws options from well-known architecture patterns, including the simpler alternative each one names, and reviews the design against them. An adopted pattern is recorded in its decision record and in the Patterns section of `ARCHITECTURE.md`.
- **Policy skills.** `lld` applies any `policy-*` skills your project provides, such as a testing or security policy, and lists them in the spec.
- **The lint** *(planned)* will check front matter, status, headings, and that every citation resolves to an item that is not withdrawn or superseded.

## Your templates

`init` copies the templates into `.blueprints/_rules/`, and from then on they are yours: edit them to suit the project, and every skill reads your copy, never the plugin's. Re-running `init` after a plugin update adds new templates and asks, file by file, before touching one you changed.

## How blueprint is designed

`blueprint` is planned with itself. Its design lives in [SYSTEM.md](SYSTEM.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md) and the decision records in [docs/adr/](docs/adr/), with terms defined in [GLOSSARY.md](GLOSSARY.md).
