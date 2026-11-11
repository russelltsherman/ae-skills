---
name: pattern-orchestration-driven-soa
description: Reference for the orchestration-driven service-oriented architecture (SOA) pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when working with, extending or migrating away from an enterprise SOA built around an enterprise service bus, or reviewing such a design.
---

# Orchestration-driven service-oriented architecture (SOA)

## What it is

Enterprise services are organized in layers: business services, enterprise services, application services and infrastructure services, coordinated by an **orchestration engine**, typically an enterprise service bus (ESB), that composes them into business processes and translates between their protocols. Reuse across the enterprise is the central goal.

## Forces it answers

- **Reuse** of shared enterprise services.
- **Integration** of heterogeneous systems through one bus.

## When it fits

- Large enterprises with many existing systems already integrated through an ESB.
- Mostly encountered today when extending or migrating away from such a system.

## When not to use it, and the simpler alternative

- **Simpler alternative:** direct integration through APIs or events, or a modular monolith for a new system.
- Not recommended for new systems: the shared bus and reuse goals couple everything together.

## Costs and risks

- The bus becomes a bottleneck and single point of coupling: every change needs coordination.
- Reuse creates wide dependencies; services are hard to change.
- Business logic in the orchestration layer is hard to test and own.

## What it means for the design

- The bus and orchestration engine are central components; services sit around them.
- Contracts are bus-defined, often canonical data models.
- Ownership is blurred by design; when migrating, assign each piece of data a single owner.

## What it leaves to component design

Service implementations, bus configuration, and the migration path away from it.

## Source

- Mark Richards and Neal Ford, [*Fundamentals of Software Architecture*](https://www.oreilly.com/library/view/fundamentals-of-software/9781098175504/), O'Reilly, 2020; 2nd edition 2025, which names this style.
