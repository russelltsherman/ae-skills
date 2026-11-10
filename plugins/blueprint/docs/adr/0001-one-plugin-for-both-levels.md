---
status: "proposed"
date: 2026-11-10
components: [M1, M2, M3, M4, M5, M6]
contracts: [I1, I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0001. Ship high-level and low-level design as one plugin

## Context and Problem Statement

HLD and LLD documents cite each other, the lint checks those citations across levels, and `lld` checks component designs against the HLD's boundary rule. Should the two levels ship as one plugin or as two?

## Decision Drivers

- SC7. Every LLD document cites the HLD items it works within, and a broken or stale citation fails `make check`.
- SC8. A component design that crosses an HLD boundary is flagged.
- One owner for the templates and the ID rules both levels use.

## Considered Options

- One plugin for both levels (simplest workable)
- Separate plugins for HLD and LLD

## Decision Outcome

Chosen option: "One plugin for both levels", because the cross-level lint and the boundary check need both document sets and one owner for the rules.

## Consequences

- Good, because one install gives the operator both levels and the lint that links them
- Bad, because the plugin cannot be adopted one level at a time

## Pros and Cons of the Options

### One plugin for both levels

- SC7: fits, because the lint reads both document sets in one place
- SC8: fits, because `lld` and `hld` share one set of rules
- Good, because there is one owner for the templates and ID rules
- Bad, because a team that wants only one level still installs both skills

### Separate plugins for HLD and LLD

- SC7: conflicts, because the lint needs the ID rules of both plugins and must be owned by one of them
- SC8: conflicts, because the boundary check spans two plugins that can be at different versions
- Good, because each level can be adopted alone
- Bad, because two plugins must be kept in step
