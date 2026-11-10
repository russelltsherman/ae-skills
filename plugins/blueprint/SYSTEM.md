---
status: living
---

# System: blueprint

## Problem

Operators who plan work with coding agents in Claude Code get planning help one change at a time. The system-level design those changes should respect lives in hand-written documents, if it is written down at all, so nothing links a change's plan to the architecture it relies on, and drift goes unnoticed.

When an agent drafts planning documents, it tends to drift from the expected format, fill gaps with guesses instead of asking, and settle design choices itself, often reaching for the fashionable or over-engineered option. The operator then has to find and undo those choices after the fact.

## Proposed solution

`blueprint` is a Claude Code plugin that guides an operator and an agent through two levels of design: a high-level design (HLD) of the whole system, and a low-level design (LLD) of each of its components. Both levels are plain Markdown in the repository, and every document cites the level above it, so a plan can be traced back to the architecture decision it relies on.

The agent works as an expert architect and analyst. It reviews what is written for gaps and contradictions, interviews the operator until each one is settled, and only then writes, following templates the project owns. The operator can work on any document at any time. A deterministic lint checks that every citation between documents resolves to a current item.

## Affected users and systems

- **Operators:** the people who run the plugin's commands and make every design decision.
- **Agents:** Claude Code sessions running the plugin's skills on the operator's behalf.
- **Projects that adopt `blueprint`:** they gain `SYSTEM.md`, `ARCHITECTURE.md`, `ROADMAP.md` and `docs/adr/` in their root, a `.blueprints/` directory, and a section in their `CLAUDE.md`.
- **Claude Code:** hosts the plugin and loads its skills.
- **`policy-*` skills a project provides:** applied to every component design.

## Constraints

- SC1. The system covers planning only: from a system intent down to a plan for one change to one component, plus the checks that link the two levels.
- SC2. Runs as a Claude Code plugin.
- SC3. Planning documents are plain Markdown in the project's repository, with flat `key: value` front matter that tooling parses without a YAML library.
- SC4. Decisions stay with the operator. The agent proposes options with trade-offs and never settles them.
- SC5. The agent aligns with the operator before it writes. Anything still unsettled is recorded as an open question or concern, never filled in with a guess.
- SC6. No gates. Documents can be started in any order, worked on side by side and left incomplete.
- SC7. Every LLD document cites the HLD items it works within, and a broken or stale citation fails `make check`.
- SC8. The HLD stays current. A component design that crosses an HLD boundary is flagged, so the operator can take it back to the HLD.

## Out of scope

- Building, reviewing, testing in CI, deploying or monitoring. Excluded because they are deferred: version 1 stops at the plan, and these stages can follow later, from this plugin or another.
- A project that spans several repositories. Excluded because it is deferred until there is a need for it.
- Generating diagrams. Excluded because it is ruled out: documents may embed diagrams, but no skill draws them.
- Using Claude Code's built-in plan mode. Excluded because it is ruled out: accepting a plan must never start implementation.
- Enforcing the order of work or approval steps between documents. Excluded because it is ruled out: planning is often nonlinear.

## Quality targets

- SQT1. Model calls and network access made by `make check`: 0. Measured by running `make check` with no network access.
- SQT2. Lint errors on the plugin's own planning documents: 0 at every commit. Measured by `make check`.
- SQT3. Eval coverage: at least 1 eval case for each of the 8 document types. Required cases include `lld` meeting a boundary crossing, `hld` being pushed to settle a decision itself, and each design skill recording an unsettled point instead of filling it in. Measured by the eval suite's list of cases.

## Open questions

- Is `blueprint` the final name?
- Can one project ever span several repositories?
- How does `lld` find the project's `policy-*` skills?
- How small can a valid HLD be, given that every component must be named in the architecture?
