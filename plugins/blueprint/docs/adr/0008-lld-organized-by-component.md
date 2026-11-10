---
status: "accepted"
date: 2026-11-10
components: [M4]
contracts: [I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0008. Give each component one living LLD set plus one plan for the change in progress

## Context and Problem Statement

Low-level design could be organized by component, by feature, or by change.

## Decision Drivers

- SC3. Planning documents are plain Markdown in the project's repository.
- Each component's design lives in one place and shows its current state.
- The LLD traces to a component `M` in the architecture.

## Considered Options

- One living set per component (`INTENT.md`, `SPEC.md`, `PROOFS.md`) plus one `PLAN.md` for the change in progress (simplest workable)
- One set per feature
- A timestamped directory per change

## Decision Outcome

Chosen option: "One living set per component plus one plan", because each component's design lives in one place and always shows its current state.

## Consequences

- Good, because components are the unit of both the HLD and the LLD
- Bad, because cross-component work needs one plan per component

## Pros and Cons of the Options

### One living set per component (`INTENT.md`, `SPEC.md`, `PROOFS.md`) plus one `PLAN.md` for the change in progress

- SC3: fits
- Good, because a component's whole design is in one directory and current
- Good, because each directory maps to one component `M`
- Bad, because a feature that spans components is split across directories

### One set per feature

- SC3: fits
- Good, because a feature is read in one place
- Bad, because a component's design is scattered across features

### A timestamped directory per change

- SC3: fits
- Good, because each change is kept whole
- Bad, because the current state must be reconstructed from many changes
