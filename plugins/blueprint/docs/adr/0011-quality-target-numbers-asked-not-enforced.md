---
status: "accepted"
date: 2026-11-10
components: [M3, M4, M5]
contracts: [I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0011. Ask for a number for every quality target, but do not enforce it

## Context and Problem Statement

A quality target such as "fast" cannot be checked. Should a number be required?

## Decision Drivers

- SC4. Decisions stay with the operator.
- SC6. No gates.
- A target without a number cannot be checked.

## Considered Options

- The design skills ask for a number and point out any target without one; nothing enforces it (simplest workable)
- Required before the architecture is written
- Enforced by the lint

## Decision Outcome

Chosen option: "Asked for, not enforced", because it leaves the call with the operator.

## Consequences

- Good, because the operator can record a target before its number is known
- Bad, because an architecture can be built on targets that cannot be checked

## Pros and Cons of the Options

### The design skills ask for a number and point out any target without one; nothing enforces it

- SC4: fits, because the operator makes the call
- SC6: fits
- Bad, because unmeasured targets can persist

### Required before the architecture is written

- SC4: fits
- SC6: conflicts, because the architecture waits on the system intent

### Enforced by the lint

- SC4: conflicts, because the tool decides instead of the operator
- SC6: conflicts, because an incomplete target fails `make check`
