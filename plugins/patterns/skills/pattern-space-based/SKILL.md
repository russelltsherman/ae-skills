---
name: pattern-space-based
description: Reference for the space-based architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing space-based architecture for extreme or unpredictable load, or reviewing a design that uses in-memory data grids.
---

# Space-based architecture

## What it is

Application logic runs in many identical **processing units**, each holding the data it needs in an in-memory data grid replicated between units. A central database is taken out of the request path: **data pumps** send changes to it asynchronously, and data readers load it at start-up. Units are added and removed as load changes, coordinated by virtualized middleware.

## Forces it answers

- **Extreme elasticity and concurrency:** removes the database as the scaling bottleneck.
- **Low latency:** reads and writes hit memory.

## When it fits

- Very high or very spiky concurrent load: ticket sales, auctions, online events, trading.
- Workloads where the database cannot keep up even with replicas and caching.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a conventional design with caching, read replicas and autoscaled stateless services, which meets almost every load target.
- Skip it for large datasets that do not fit in memory, or where strict consistency is required.

## Costs and risks

- Very complex to build, test and operate.
- Data collisions between replicated units, and data loss risk in the asynchronous path to the database.
- Expensive memory and specialized products.

## What it means for the design

- Processing units, middleware (messaging grid, data grid, deployment manager) and the asynchronous database writer as components.
- Contracts are mostly internal to the grid; the external API is usually unchanged.
- The database remains the system of record; units hold replicated working copies.

## What it leaves to component design

The data grid product, replication and collision handling, and the data pump design.

## Source

- Mark Richards, *Software Architecture Patterns*, O'Reilly, 2015, chapter 5.
