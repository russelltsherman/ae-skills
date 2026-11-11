---
name: pattern-onion
description: Reference for the onion architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing onion architecture or other domain-centric architectures, or reviewing a design that uses one.
---

# Onion architecture

## What it is

The application is drawn as concentric rings around an independent **domain model** at the center. Around it sit domain services, then application services, and on the outside the user interface, infrastructure and tests. Its tenets:

- the application is built around an independent object model;
- inner rings define interfaces, and outer rings implement them;
- all coupling points toward the center;
- infrastructure, such as data access, is pushed to the outer ring.

It shares its core idea with hexagonal and clean architecture (see those patterns), adding explicit rings inside the core.

## Forces it answers

- **Protecting the domain model** from infrastructure, frameworks and user interface changes.
- **Testability** of domain and application logic without infrastructure.
- **Replaceability** of the outer ring, which holds the things that change most often.

## When it fits

- Components with a rich domain model, often designed with domain-driven design.
- Long-lived business applications whose infrastructure will change.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a plain layered structure, where the data layer at the bottom is acceptable, for components with thin logic.
- Skip it for simple data-in, data-out services and short-lived code.

## Costs and risks

- More interfaces and mapping between rings.
- Ring boundaries need enforcing, or infrastructure creeps into the domain.
- Teams can over-split the core into rings that add no value.

## What it means for the design

- A structure inside one component; at the architecture level it affects only how the component meets its contracts, through the outer ring.
- Contracts with other components are implemented in the outer ring.
- No change to data ownership; persistence lives in the outer ring behind interfaces the inner rings define.

## What it leaves to component design

The rings and what goes in each, the interfaces between them, and how dependency direction is enforced.

## Source

- Jeffrey Palermo, ["The Onion Architecture: part 1"](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/), 2008.
