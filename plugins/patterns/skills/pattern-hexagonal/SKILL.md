---
name: pattern-hexagonal
description: Reference for the hexagonal (ports and adapters) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing hexagonal, ports and adapters, or other domain-centric architectures, or reviewing a design that uses one.
---

# Hexagonal (ports and adapters)

## What it is

The application core holds the business logic and knows nothing about the outside world. It defines **ports**: interfaces for what it offers (driving or primary ports, used by user interfaces, APIs, tests and batch jobs) and for what it needs (driven or secondary ports, such as storage, messaging and other systems). **Adapters** outside the core implement those ports for a specific technology. Dependencies point inward: adapters depend on the core, never the reverse. The hexagon is only a drawing; the number of sides means nothing.

Onion architecture and clean architecture are close relatives with different vocabulary (see those patterns).

## Forces it answers

- **Testability:** the core runs under automated tests with fake adapters, without a database, network or user interface.
- **Technology independence:** replace a database, framework or delivery mechanism by writing a new adapter.
- **Several ways in:** the same logic driven by a web API, a command line, a queue or tests.

## When it fits

- Components with substantial business logic worth protecting from infrastructure churn.
- Long-lived systems whose technologies will change.
- Teams that want fast, isolated tests of business rules.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a plain layered structure, or calling the framework and database directly, for components that are mostly data in and data out with little logic.
- Skip it for small services, prototypes and scripts, where ports and adapters add more code than they protect.

## Costs and risks

- More interfaces, mapping code and indirection, even for simple operations.
- Over-abstraction: ports for things that will never change.
- Leaky ports that expose technology details defeat the point.

## What it means for the design

- Mostly a structure inside one component; at the architecture level it shapes how a component's contracts are provided (by driving adapters) and how it reaches others (through driven adapters).
- Each contract with another component is implemented by an adapter, keeping the core independent of it.
- No change to data ownership; the component's storage sits behind a driven port.

## What it leaves to component design

The ports and their granularity, the adapters, the dependency-injection approach, and how the core is tested.

## Source

- Alistair Cockburn, ["The Hexagonal (Ports & Adapters) Architecture"](https://alistair.cockburn.us/hexagonal-architecture/), 2005.
