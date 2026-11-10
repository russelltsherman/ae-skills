---
status: "accepted"
date: 2026-11-10
components: [M5]
contracts: [I5]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0010. The lint checks that cited IDs exist and are not withdrawn or superseded

## Context and Problem Statement

The lint resolves every citation. How much should it check beyond the ID existing?

## Decision Drivers

- SC6. Documents may be left incomplete.
- SC7. A broken or stale citation fails `make check`.
- SQT1. `make check` makes 0 model calls.
- SQT2. 0 lint errors on the plugin's own documents at every commit.

## Considered Options

- Existence only (simplest workable)
- Existence, and not withdrawn or superseded
- Also coverage, such as a target that no component serves

## Decision Outcome

Chosen option: "Existence, and not withdrawn or superseded", because it keeps living documents pointed at current decisions while staying deterministic.

## Consequences

- Good, because superseding a decision surfaces every document that still relies on the old one
- Bad, because coverage gaps are left to the design skills' reviews

## Pros and Cons of the Options

### Existence only

- SC6: fits
- SC7: conflicts, because a citation of a superseded decision passes
- SQT1: 0 model calls, meets the target
- SQT2: easy to meet

### Existence, and not withdrawn or superseded

- SC6: fits
- SC7: fits
- SQT1: 0 model calls, meets the target
- SQT2: met by updating citations whenever a decision is superseded

### Also coverage, such as a target that no component serves

- SC6: conflicts, because incomplete documents fail
- SC7: fits
- SQT1: meets the target
- SQT2: hard to meet while documents are in progress
