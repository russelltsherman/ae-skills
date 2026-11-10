---
status: "proposed"
date: 2026-11-10
components: [M3, M4, M5]
contracts: [I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0003. Give each design level its own ID prefixes

## Context and Problem Statement

Items in planning documents are cited by ID. The lint and readers both need to know which level an ID belongs to.

## Decision Drivers

- SC7. Citations are checked across levels.
- A reader can tell a citation's level at a glance.

## Considered Options

- Distinct prefixes per level: `SC SQT M I D` for HLD, `C QT R` for LLD (simplest workable)
- Shared letters with a level prefix, such as `H-R1` and `L-R1`

## Decision Outcome

Chosen option: "Distinct prefixes per level", because a citation shows its level at a glance and the lint can tell the levels apart without extra syntax.

## Consequences

- Good, because citations stay short and unambiguous
- Bad, because a new prefix is needed for each new kind of item

## Pros and Cons of the Options

### Distinct prefixes per level: `SC SQT M I D` for HLD, `C QT R` for LLD

- SC7: fits, because the prefix alone tells the lint which documents to resolve against
- Good, because IDs stay short
- Bad, because there are eight prefixes to learn

### Shared letters with a level prefix, such as `H-R1` and `L-R1`

- SC7: fits
- Good, because there are fewer letters to learn
- Bad, because every citation is longer and easier to mistype
