---
status: "accepted"
date: 2026-11-10
components: [M2, M3, M4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0005. Make every blueprint skill command-only

## Context and Problem Statement

Claude Code skills can be invoked by the model when it judges them relevant, or only by the operator as commands. Which do `init`, `hld` and `lld` use?

## Decision Drivers

- SC4. Decisions stay with the operator.
- SC6. No gates: the operator chooses what to work on and when.

## Considered Options

- Command-only (`disable-model-invocation: true`) (simplest workable)
- Model-invoked

## Decision Outcome

Chosen option: "Command-only", because the operator chooses when to work at each level.

## Consequences

- Good, because no planning document changes without the operator starting the work
- Bad, because an agent working on code never pulls in the design skills by itself

## Pros and Cons of the Options

### Command-only (`disable-model-invocation: true`)

- SC4: fits, because design work starts only when the operator asks
- SC6: fits, because the operator chooses when to work at each level
- Bad, because the operator must know the three commands

### Model-invoked

- SC4: conflicts, because the agent may start design work, or scaffold a project, unasked
- SC6: fits
- Good, because the skills are discovered without the operator knowing them
