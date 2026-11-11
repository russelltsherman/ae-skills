---
name: pattern-microservices
description: Reference for the microservices architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing microservices or reviewing a design that uses them.
---

# Microservices

## What it is

The application is built as many small services, each deployed on its own, owning its own data and responsible for one business capability. Services talk over the network through APIs or messages, never through a shared database.

## Forces it answers

- **Independent deployment:** teams release their service without coordinating a whole-system release.
- **Independent scaling** of the parts under load.
- **Team autonomy** in large organizations, aligned with service boundaries.
- **Fault isolation**, when combined with patterns such as circuit breakers.

## When it fits

- Several teams working on one system, slowed down by a shared codebase and release.
- Parts of the system with clearly different scaling, availability or technology needs.
- A well-understood domain whose boundaries are stable.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a modular monolith (see that pattern), one deployable with clear internal module boundaries. It can be split later along those boundaries.
- Skip it for small teams, new products whose domain is still changing, and systems without strong operational tooling.
- Choosing it because it is common is the classic fashionable default: name the target that needs it.

## Costs and risks

- A distributed system's problems: network failures, latency, partial failure, distributed transactions (see saga).
- Operational overhead: deployment pipelines, service discovery, monitoring and tracing per service.
- Wrong boundaries are expensive to move, and chatty services can be slower than the monolith they replaced.
- Requires greater architectural and operational expertise.

## What it means for the design

- Many components, one per service, each a candidate for its own detailed design.
- Many contracts: every service API and event is a contract to version.
- Each service owns its data exclusively; no shared tables.

## What it leaves to component design

Each service's internals, technology stack, persistence, and how it implements its contracts.

## Source

- James Lewis and Martin Fowler, ["Microservices"](https://martinfowler.com/articles/microservices.html), 2014.
