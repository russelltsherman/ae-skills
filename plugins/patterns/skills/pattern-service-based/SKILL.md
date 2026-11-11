---
name: pattern-service-based
description: Reference for the service-based architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing service-based architecture, comparing it with a modular monolith or microservices, or reviewing a design that uses it.
---

# Service-based architecture

## What it is

The system is split into a small number of coarse-grained, separately deployed services, typically four to twelve, each covering a whole business domain such as orders or billing. A user interface or API layer calls them. Unlike microservices, the services usually share one database, or a few, and are not split further for independent scaling.

## Forces it answers

- **Independent deployment** of large domains without the full cost of microservices.
- **Simple data handling:** a shared database keeps transactions and queries local.
- **Fault isolation** between domains.

## When it fits

- A system with a handful of clear domains that one or a few teams maintain.
- A step out of a monolith when deploying everything together hurts, but microservices would be too much.
- Domains that change at different rates.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a modular monolith, when deploying the domains separately is not yet needed.
- Move to microservices only when parts need independent scaling or a team per service, and are willing to own their data.
- The shared database stops fitting when domains start writing each other's tables.

## Costs and risks

- The shared database couples services: a schema change can break several of them.
- Coarse services scale as a whole, not per function.
- Still a distributed system: network calls, partial failure, and deployment pipelines per service.

## What it means for the design

- One component per service, plus the user interface or API layer.
- Each service's API is a contract.
- Data ownership must still be assigned per table or schema, even in a shared database, or services start writing each other's data.

## What it leaves to component design

Each service's internal structure, the database schema split, and how services are deployed.

## Source

- Mark Richards and Neal Ford, [*Service-Based Architectures*](https://www.oreilly.com/library/view/service-based-architectures/9781491932636/), O'Reilly video, 2015.
- Mark Richards and Neal Ford, [*Fundamentals of Software Architecture*](https://www.oreilly.com/library/view/fundamentals-of-software/9781098175504/), O'Reilly, 2020; 2nd edition 2025.
