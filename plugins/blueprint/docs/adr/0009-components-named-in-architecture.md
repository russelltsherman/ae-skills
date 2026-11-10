---
status: "accepted"
date: 2026-11-10
components: [M4, M5]
contracts: [I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0009. Every LLD directory names a component in the architecture, and the HLD is not a gate

## Context and Problem Statement

LLD documents design components the HLD defines. How much HLD must exist before `lld` can work?

## Decision Drivers

- SC6. No gates: documents can be started in any order and left incomplete.
- SC7. Every LLD document cites the HLD items it works within.

## Considered Options

- Every LLD directory must name a component in `ARCHITECTURE.md`, checked by the lint; otherwise `lld` works with whatever HLD exists and reports its gaps (simplest workable)
- `lld` cannot run without the HLD
- The HLD is fully optional, and LLD skips HLD checks

## Decision Outcome

Chosen option: "Every LLD directory names a component in the architecture, and `lld` otherwise works with whatever HLD exists", because every component stays traceable to the architecture without making the HLD a gate.

## Consequences

- Good, because LLD work can start as soon as a component is named
- Bad, because even a small project needs a minimal architecture before its LLD passes the lint

## Pros and Cons of the Options

### Every LLD directory must name a component in `ARCHITECTURE.md`, checked by the lint; otherwise `lld` works with whatever HLD exists and reports its gaps

- SC6: fits, because a thin HLD is enough to start
- SC7: fits, because the lint still ties every directory to a component
- Bad, because a component must be in the architecture before its LLD passes the lint

### `lld` cannot run without the HLD

- SC6: conflicts, because the LLD waits on the HLD
- SC7: fits

### The HLD is fully optional, and LLD skips HLD checks

- SC6: fits
- SC7: conflicts, because an LLD directory may trace to nothing
