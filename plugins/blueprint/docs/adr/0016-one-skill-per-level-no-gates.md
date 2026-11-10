---
status: "accepted"
date: 2026-11-10
components: [M3, M4]
contracts: [I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0016. One design skill per level that aligns before writing, with no gates between documents

## Context and Problem Statement

The plugin needs skills for eight document types. The skills could be one per document type, chained so that running each one approves the document before it, or one per level.

## Decision Drivers

- SC4. Decisions stay with the operator.
- SC5. The agent aligns with the operator before it writes.
- SC6. No gates: documents can be started in any order.
- The agent follows the project's template for every document.

## Considered Options

- One design skill per level, `hld` and `lld`, each reviewing for gaps and contradictions and interviewing the operator before writing to the templates (simplest workable)
- One skill per document type, each one approving the previous document by being run

## Decision Outcome

Chosen option: "One design skill per level", because each level shares one stance and one set of documents, and the skills exist so the agent follows the templates and aligns before writing, not to enforce a sequence.

## Consequences

- Good, because there are only three commands to learn
- Bad, because nothing records that a document was approved

## Pros and Cons of the Options

### One design skill per level, `hld` and `lld`, each reviewing for gaps and contradictions and interviewing the operator before writing to the templates

- SC4: fits
- SC5: fits, because the review and interview are the skill's core steps
- SC6: fits, because the operator points the skill at any document
- Good, because each level's stance and reading are stated once
- Bad, because each skill covers four document types

### One skill per document type, each one approving the previous document by being run

- SC4: fits
- SC5: fits
- SC6: conflicts, because the chain fixes an order
- Bad, because seven skills repeat the same stance
