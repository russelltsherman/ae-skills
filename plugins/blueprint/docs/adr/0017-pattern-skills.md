---
status: "accepted"
date: 2026-11-10
components: [M1, M3, M5]
contracts: [I1, I3]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0017. hld draws on pattern-* skills from a separate patterns plugin, recorded in decision records and the architecture

## Context and Problem Statement

When `hld` proposes options for a significant choice, it draws on whatever it happens to know about architecture patterns. That makes options uneven, and it feeds the fashionable-defaults and over-engineering failure modes. Should well-known architecture patterns, such as the 14 in Red Hat's "14 software architecture patterns", be available to `hld` as `pattern-*` skills, where should those skills come from, and where is a pattern a project adopts recorded?

## Decision Drivers

- SC4. Decisions stay with the operator: patterns inform options, they never settle them.
- SC5. The agent aligns before it writes, which needs real options with known costs.
- Over-engineering and fashionable defaults: every pattern must come with its costs and its simpler alternative.
- D5. Every `blueprint` skill is command-only, but `hld` must be able to load pattern skills on its own.
- The patterns are useful outside `blueprint`.

## Considered Options

- A separate `patterns` plugin ships the `pattern-*` skills, model-invocable; `hld` uses whichever are loaded
- `blueprint` ships the `pattern-*` skills itself, model-invocable and hidden from the menu
- Projects write their own `pattern-*` skills, like `policy-*` skills; no plugin ships any (simplest workable)

## Decision Outcome

Chosen option: "A separate `patterns` plugin ships the `pattern-*` skills", because it gives every project the same well-written set without changing D5, and the patterns stay usable outside `blueprint`.

`hld` uses the pattern skills two ways: as a source of options when a significant choice comes up, always including the simpler alternative each pattern names, and as a lens in review, checking that every adopted pattern is justified by a constraint or target and that its costs are weighed. A pattern a project adopts is recorded in both places: the decision record's `patterns:` front matter, and a Patterns section in `ARCHITECTURE.md` citing that decision. A project can add its own `pattern-*` skills beside the plugin's.

## Consequences

- Good, because options for a significant choice come with known costs and a simpler alternative
- Good, because the patterns a system uses are visible in one place in the architecture
- Bad, because `hld` works without patterns when the `patterns` plugin is not installed
- Bad, because the decision records and the Patterns section can drift apart unless the lint checks them

## Pros and Cons of the Options

### A separate `patterns` plugin ships the `pattern-*` skills, model-invocable; `hld` uses whichever are loaded

- SC4: fits, because patterns only shape the options
- SC5: fits, because options come with costs and alternatives written down
- Over-engineering: each skill names the simpler alternative and when not to use the pattern
- D5: fits, because `blueprint`'s own skills stay command-only
- Good, because the patterns work in any project, with or without `blueprint`
- Bad, because there is a second plugin to install and keep in step

### `blueprint` ships the `pattern-*` skills itself, model-invocable and hidden from the menu

- SC4: fits
- SC5: fits
- D5: conflicts, so it needs a new record superseding D5
- Good, because one install gives `hld` its patterns
- Bad, because the patterns are tied to `blueprint`

### Projects write their own `pattern-*` skills, like `policy-*` skills; no plugin ships any

- SC4: fits
- SC5: fits only once a project has written its patterns
- D5: fits
- Good, because nothing new is shipped
- Bad, because every project rewrites the same well-known patterns, with uneven quality
