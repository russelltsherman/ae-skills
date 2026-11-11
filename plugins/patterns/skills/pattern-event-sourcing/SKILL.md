---
name: pattern-event-sourcing
description: Reference for the event sourcing architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing event sourcing or reviewing a design that uses it.
---

# Event sourcing

## What it is

Instead of storing the current state and overwriting it, a component stores every change as an immutable event in an append-only log. The current state is derived by replaying the events, usually sped up with snapshots. Other views of the data are built as projections of the same log.

## Forces it answers

- **Complete audit history:** every change, who made it and when, is kept by construction.
- **Rebuilding and new views:** new read models or reports can be built by replaying history.
- **Temporal queries:** what the state was at any past moment.
- **Integration:** the event log is a natural feed for other components.

## When it fits

- Domains where history matters in itself: finance, ledgers, compliance, workflows with audit requirements.
- Systems that already need CQRS-style read models.
- Cases where a later question about past behavior is likely and expensive to miss.

## When not to use it, and the simpler alternative

- **Simpler alternative:** store current state in a database, and add an audit table or change data capture for the history that matters.
- Skip it for simple data, for teams new to it on a deadline, and where data must be truly erasable on request without extra design.

## Costs and risks

- Event schemas are forever: changing them needs versioning and upcasting.
- Replays get slow without snapshots; projections are eventually consistent.
- Deleting personal data from an immutable log needs a deliberate approach such as crypto-shredding.
- A steep learning curve, and harder ad-hoc queries.

## What it means for the design

- The owning component keeps an event store; projections may be separate components.
- A contract for the events themselves, if other components consume them.
- The component that appends events owns the log. Projections own only derived, rebuildable data.

## What it leaves to component design

The event schema and versioning, snapshot policy, store technology, projection code, and replay tooling.

## Source

- Martin Fowler, ["Event Sourcing"](https://martinfowler.com/eaaDev/EventSourcing.html), 2005.
