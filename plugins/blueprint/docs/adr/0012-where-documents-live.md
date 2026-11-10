---
status: "accepted"
date: 2026-11-10
components: [M1, M2, M3, M4]
contracts: [I1, I2, I3, I4]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0012. HLD in the project root and docs/adr/, LLD and rules under .blueprints/

## Context and Problem Statement

Planning documents need fixed paths that people, agents and the lint can find.

## Decision Drivers

- SC3. Planning documents are plain Markdown in the project's repository.
- The HLD sits where readers of the project look first.
- Upper-case file names mark agent steering documents.
- `docs/adr/` is where architecture decision records are conventionally kept.

## Considered Options

- `SYSTEM.md`, `ARCHITECTURE.md` and `ROADMAP.md` in the project root, decision records in `docs/adr/`, LLD and rules under `.blueprints/`
- Everything under one hidden `.blueprint/` directory (simplest workable)
- Lower-case HLD names in the root, decision records in a root `decisions/` directory

## Decision Outcome

Chosen option: "HLD in the project root and `docs/adr/`, LLD and rules under `.blueprints/`", because the HLD sits where readers look first, and the names follow the conventions for steering documents and decision records.

## Consequences

- Good, because the system's design is visible at the top of the project
- Bad, because the lint must find blueprint documents by path among other upper-case files such as `README.md`

## Pros and Cons of the Options

### `SYSTEM.md`, `ARCHITECTURE.md` and `ROADMAP.md` in the project root, decision records in `docs/adr/`, LLD and rules under `.blueprints/`

- SC3: fits
- Good, because the HLD is the first thing a reader of the project sees
- Good, because it follows the steering-document and ADR conventions
- Bad, because blueprint files are spread over three places

### Everything under one hidden `.blueprint/` directory

- SC3: fits
- Good, because one directory holds everything
- Bad, because the HLD is hidden from readers of the project

### Lower-case HLD names in the root, decision records in a root `decisions/` directory

- SC3: fits
- Bad, because it breaks both the steering-document and the ADR conventions
