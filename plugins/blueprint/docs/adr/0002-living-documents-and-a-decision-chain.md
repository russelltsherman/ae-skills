---
status: "accepted"
date: 2026-11-10
components: [M3, M4]
contracts: [I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0002. Keep planning documents living, with an immutable chain of decision records and one plan per change

## Context and Problem Statement

Planning documents must change as the system changes. Either each change gets its own documents, or documents are edited in place and git keeps their history. Decision records and plans raise the same question.

## Decision Drivers

- SC3. Planning documents are plain Markdown in the project's repository.
- Merged documents reflect the current state of the project.
- The reason each decision changed stays readable without digging through git history.
- Nothing in a plan outlives its change.

## Considered Options

- Living planning documents, an immutable chain of decision records, and one plan per change that the next plan replaces
- Everything living, decision records and plan included (simplest workable)
- A new directory of documents for every change

## Decision Outcome

Chosen option: "Living planning documents, an immutable chain of decision records, and one plan per change that the next plan replaces", because merged documents show the current state, the chain of records keeps how each choice changed and why, and the plan's last step carries any lasting lessons into the living documents.

## Consequences

- Good, because a reader finds the current design in one place
- Bad, because an accepted decision record cannot be corrected in place; a fix needs a new record

## Pros and Cons of the Options

### Living planning documents, an immutable chain of decision records, and one plan per change that the next plan replaces

- SC3: fits, because git keeps the history of every living document
- Good, because every document except the plan shows the current state
- Good, because superseded decision records stay in place and show how each choice changed and why
- Bad, because there are three lifecycles to learn: living, immutable record, and one-change plan

### Everything living, decision records and plan included

- SC3: fits
- Good, because there is one lifecycle
- Bad, because the reason a decision changed survives only in git history

### A new directory of documents for every change

- SC3: fits
- Good, because each change's planning is kept whole
- Bad, because the current state is spread across many directories and must be reconstructed
