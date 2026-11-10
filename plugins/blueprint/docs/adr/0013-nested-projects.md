---
status: "accepted"
date: 2026-11-10
components: [M2, M3, M5]
contracts: [I2, I3]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0013. A repository holds projects that can nest, and a nested project implements one parent component

## Context and Problem Statement

A component can grow large enough to need its own architecture. How do projects relate to repositories and to each other?

## Decision Drivers

- SC7. Citations stay traceable across levels.
- A large component can get its own architecture.

## Considered Options

- One project per repository (simplest workable)
- Several projects per repository that can nest; a nested project implements one component of its parent and its `SYSTEM.md` cites it
- Several projects per repository, nested projects independent of their parent

## Decision Outcome

Chosen option: "Nesting projects that implement a parent component", because a large component gets its own architecture while staying traceable to its parent's.

## Consequences

- Good, because the same skills run at every scale
- Bad, because IDs repeat across projects, so every citation resolves within its own project

## Pros and Cons of the Options

### One project per repository

- SC7: fits
- Bad, because a large component cannot have its own architecture

### Several projects per repository that can nest; a nested project implements one component of its parent and its `SYSTEM.md` cites it

- SC7: fits, because `implements:` resolves in the parent's architecture
- Good, because a large component gets its own HLD while staying traceable
- Bad, because the lint must find project roots and resolve one citation across projects

### Several projects per repository, nested projects independent of their parent

- SC7: conflicts, because a nested project does not trace to its parent
- Good, because projects are fully separate
