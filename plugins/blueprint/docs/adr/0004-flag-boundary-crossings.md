---
status: "accepted"
date: 2026-11-10
components: [M3, M4]
contracts: [I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0004. lld flags a design that crosses an HLD boundary instead of refusing or editing the HLD

## Context and Problem Statement

A component design can cross into the HLD: add, remove or split a component, change a contract, move data ownership, change a quality target, or contradict an accepted decision. What does `lld` do when it finds one?

## Decision Drivers

- SC4. Decisions stay with the operator.
- SC6. No gates: documents can be worked on in any order.
- SC8. The HLD stays current: a crossing is flagged so the operator can take it back to the HLD.

## Considered Options

- `lld` flags the crossing, names the HLD change needed and keeps it out of the LLD documents; the operator takes it to `hld` when they choose (simplest workable)
- `lld` refuses to write until the HLD changes
- `lld` edits the architecture itself

## Decision Outcome

Chosen option: "`lld` flags the crossing", because it keeps HLD decisions with the operator and out of a single component's design, without blocking LLD work.

## Consequences

- Good, because the operator decides when to revisit the HLD
- Bad, because nothing forces a flagged crossing to be resolved before code is written

## Pros and Cons of the Options

### `lld` flags the crossing, names the HLD change needed and keeps it out of the LLD documents; the operator takes it to `hld` when they choose

- SC4: fits, because the HLD change is the operator's to make
- SC6: fits, because the rest of the LLD work carries on
- SC8: fits, because the crossing and the change it needs are named
- Bad, because a flagged crossing can be left unresolved

### `lld` refuses to write until the HLD changes

- SC4: fits
- SC6: conflicts, because the LLD is blocked on the HLD
- SC8: fits
- Good, because a crossing cannot be ignored

### `lld` edits the architecture itself

- SC4: conflicts, because an HLD decision is settled from inside one component's design
- SC6: fits
- SC8: fits
- Bad, because HLD changes appear without an HLD review
