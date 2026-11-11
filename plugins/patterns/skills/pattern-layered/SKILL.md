---
name: pattern-layered
description: Reference for the layered (n-tier) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a layered architecture or reviewing a design that uses one.
---

# Layered (n-tier)

## What it is

The system is split into horizontal layers, each with one kind of responsibility, such as presentation, application or business logic, and data access. A layer calls only the layer below it (strict) or any layer below it (relaxed). Requests travel down through the layers and results travel back up.

The idea goes back to systems layered by level of abstraction, each layer built only on the one below. The presentation, business and data tiers are its later enterprise-application form.

## Forces it answers

- **Separation of concerns:** each layer can be understood, tested and changed on its own.
- **Replaceability** of one layer, such as swapping the user interface or the database, without rewriting the rest.
- **Familiarity:** most developers know the pattern, so onboarding is quick.

## When it fits

- Typical business applications, e-commerce sites and desktop applications.
- A single team building a monolith whose domain is not yet well understood.
- A starting point that can be split up later if needed.

## When not to use it, and the simpler alternative

- **Simpler alternative:** for a small tool or script, a single module with no formal layers.
- Alternatives with different trade-offs: vertical slices, when most changes cut across every layer, and hexagonal, onion or clean architecture, when the business logic must not depend on the database (see those patterns).
- It fits poorly when parts of the system need to scale or deploy independently, or when most changes cut across every layer anyway.

## Costs and risks

- Changes often touch every layer, so feature work is spread out.
- Pass-through layers that add nothing ("sinkhole" calls) add code and latency.
- Layers grow coupled over time and become hard to split apart later.

## What it means for the design

- Each layer may be a component, or the layers may live inside one component; decide which at the architecture level.
- Contracts between adjacent layers, owned by the lower layer.
- The data access layer owns persistence; higher layers never reach the store directly.

## What it leaves to component design

Module boundaries within each layer, whether layering is strict or relaxed, and the frameworks used per layer.

## Source

- Edsger W. Dijkstra, ["The Structure of the 'THE'-Multiprogramming System"](https://doi.org/10.1145/363095.363143), *Communications of the ACM* 11(5), 1968, which layered a system by level of abstraction.
- Frank Buschmann, Regine Meunier, Hans Rohnert, Peter Sommerlad and Michael Stal, [*Pattern-Oriented Software Architecture, Volume 1: A System of Patterns*](https://www.wiley.com/en-us/Pattern-Oriented+Software+Architecture%2C+Volume+1%2C+A+System+of+Patterns-p-9780471958697), Wiley, 1996, "Layers".
