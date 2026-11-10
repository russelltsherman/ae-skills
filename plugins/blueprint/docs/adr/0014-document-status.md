---
status: "accepted"
date: 2026-11-10
components: [M3, M4, M5]
contracts: [I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0014. Every document carries a status, and decision records use the MADR statuses

## Context and Problem Statement

A proposed decision record must be told apart from an accepted one, and a finished plan from one in progress. Should documents carry a status, and which values?

## Decision Drivers

- SC3. Flat front matter that tooling parses without a YAML library.
- SC7. The lint checks status and rejects citations of superseded decisions.
- A status set that readers already know.

## Considered Options

- No status field (simplest workable)
- A lifecycle status, such as draft, review or approved, on every document
- A status per document type: `living` for living documents, `proposed` or `completed` for the plan, and the MADR statuses for decision records, with the status line the only part of an accepted record that may change

## Decision Outcome

Chosen option: "A status per document type", because it tells a proposed decision record from an accepted one, uses a familiar status set, and shows a superseded record as superseded where it is read, while living documents need no lifecycle.

## Consequences

- Good, because the lint can check every status against its document type
- Bad, because superseding a decision edits two records

## Pros and Cons of the Options

### No status field

- SC3: fits
- SC7: conflicts, because the lint cannot tell a superseded decision from a current one
- Bad, because a proposed decision looks the same as an accepted one

### A lifecycle status, such as draft, review or approved, on every document

- SC3: fits
- SC7: fits
- Bad, because it adds approval steps to living documents

### A status per document type: `living` for living documents, `proposed` or `completed` for the plan, and the MADR statuses for decision records, with the status line the only part of an accepted record that may change

- SC3: fits
- SC7: fits, because a superseded record says so where it is read
- Good, because MADR's statuses are already familiar
