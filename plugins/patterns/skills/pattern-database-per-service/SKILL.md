---
name: pattern-database-per-service
description: Reference for the database per service pattern and its alternative, the shared database - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when deciding whether components share a database or each own their own, or reviewing data ownership in a design.
---

# Database per service (versus shared database)

## What it is

Each component or service keeps its data private, in its own database or schema, and other components reach that data only through its API or events. The alternative is a **shared database** that several components read and write directly, which microservices.io lists as an anti-pattern for microservices but which service-based and monolithic designs use deliberately.

## Forces it answers

- **Loose coupling:** a component changes its schema without breaking others.
- **Clear data ownership:** exactly one writer for each piece of data.
- **Independent scaling and technology choice** for each store.

## When it fits

- Microservices and any design where components must evolve and deploy independently.
- Components with very different storage needs.

## When not to use it, and the simpler alternative

- **Simpler alternative:** one shared database with a schema or set of tables owned by each component, and a rule that only the owner writes them.
- A fully shared database is acceptable when the components deploy together, such as in a monolith or service-based design.

## Costs and risks

- Queries and transactions across components need APIs, events, sagas or read models (CQRS).
- Data is duplicated across components and is eventually consistent.
- More databases to operate, back up and secure.

## What it means for the design

- Every store is owned by one component; draw this in the data ownership table.
- Data other components need becomes part of the owner's API or event contracts.
- This pattern is mostly a data ownership decision: record which component writes which data.

## What it leaves to component design

The schema, storage technology, and how each component publishes the data others need.

## Source

- Chris Richardson, ["Pattern: Database per service"](https://microservices.io/patterns/data/database-per-service.html) and ["Pattern: Shared database"](https://microservices.io/patterns/data/shared-database.html), microservices.io.
- Chris Richardson, *Microservices Patterns*, Manning, 2018.
