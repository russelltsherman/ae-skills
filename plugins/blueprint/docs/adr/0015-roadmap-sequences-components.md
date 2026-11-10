---
status: "accepted"
date: 2026-11-10
components: [M3]
contracts: [I3]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0015. The roadmap groups components by phase, with no feature IDs

## Context and Problem Statement

The roadmap sequences the work. It could sequence the architecture's components directly, or features that each touch several components.

## Decision Drivers

- SC1. The system covers planning, from a system intent down to a plan for one change to one component.
- No third unit of planning between the HLD and the LLD.

## Considered Options

- Components grouped by phase, saying what each phase builds for each component (simplest workable)
- Features `F` grouped by phase, each naming the components it touches

## Decision Outcome

Chosen option: "Components grouped by phase", because components are already the unit of both the HLD and the LLD.

## Consequences

- Good, because the roadmap needs no IDs of its own
- Bad, because the roadmap does not name features

## Pros and Cons of the Options

### Components grouped by phase, saying what each phase builds for each component

- SC1: fits, because each roadmap entry leads straight to one component's LLD
- Bad, because a user-visible feature is described across several entries

### Features `F` grouped by phase, each naming the components it touches

- SC1: fits
- Good, because phases read as features
- Bad, because it adds a third unit and ID prefix that the LLD must map back to components
