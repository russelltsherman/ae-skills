---
name: pattern-clean-architecture
description: Reference for the clean architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing clean architecture or other domain-centric architectures, or reviewing a design that uses one.
---

# Clean architecture

## What it is

Code is arranged in concentric circles: **entities** (enterprise business rules) at the center, then **use cases** (application business rules), then **interface adapters** (controllers, presenters, gateways), and on the outside **frameworks and drivers** (web, database, devices). The **dependency rule** governs it: source code dependencies point only inward, and nothing in an inner circle names anything in an outer one. Data crosses boundaries as simple structures, and control flows outward through interfaces the inner circles define.

It unifies hexagonal and onion architecture (see those patterns) under one rule, adding the explicit use-case layer.

## Forces it answers

- **Independence** of business rules from frameworks, user interface, database and external agencies.
- **Testability** of entities and use cases in isolation.
- **Use cases visible in the code:** the application's capabilities are named classes, not scattered across controllers.

## When it fits

- Components with significant, long-lived business rules.
- Systems expected to outlive their frameworks.
- Teams that value strict, checkable dependency rules.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a plain layered structure, or vertical slices that call the framework and database directly, for components with thin logic.
- Skip it for small services, CRUD applications and prototypes, where four circles and boundary mapping cost more than they save.

## Costs and risks

- Many small types: request and response models, presenters, gateways, and mapping between them.
- Ceremony for simple operations, which teams often resent and then bypass.
- Misread as a fixed four-folder template rather than a dependency rule.

## What it means for the design

- A structure inside one component; at the architecture level it affects only how contracts are provided (through interface adapters) and how other components are reached (through gateways).
- Contracts with other components live in the interface adapter circle.
- No change to data ownership; the database is a detail in the outermost circle.

## What it leaves to component design

The use cases, the boundary data structures, the gateways, how the dependency rule is enforced, and how strictly the circles are kept.

## Source

- Robert C. Martin, ["The Clean Architecture"](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), 2012.
- Robert C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, Prentice Hall, 2017.
