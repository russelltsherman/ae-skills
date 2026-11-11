---
name: pattern-anti-corruption-layer
description: Reference for the anti-corruption layer pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when integrating with a legacy or external system whose model differs from yours, or reviewing such an integration.
---

# Anti-corruption layer

## What it is

A translation layer sits between your component and another system, usually a legacy system or a third party. It converts the other system's model, terms and protocols into your own, so the other system's concepts never leak into your model. It is the context-map relationship for integrating with a model you cannot change.

## Forces it answers

- **Model integrity:** your design is not bent to fit the other system.
- **Changeability:** when the other system changes or is replaced, only the layer changes.

## When it fits

- Integrating with legacy systems, especially during a strangler migration.
- Third-party systems with awkward or unstable models.
- Mergers of systems built with different models.

## When not to use it, and the simpler alternative

- **Simpler alternative:** use the other system's model directly (the conformist relationship), when it is clean, stable and close to yours.
- Skip it for a single, trivial call.

## Costs and risks

- Translation code to build, test and keep in step with both sides.
- Extra latency and another component when the layer is a separate service.
- It can grow into a large component of its own.

## What it means for the design

- The layer may be inside your component or a separate component.
- It implements the contract with the other system and offers your own contract inward.
- It owns no business data; any mapping or correlation data it keeps is its own.

## What it leaves to component design

The translation mappings, the adapters, caching, and error mapping.

## Source

- Eric Evans, [*Domain-Driven Design: Tackling Complexity in the Heart of Software*](https://www.informit.com/store/domain-driven-design-tackling-complexity-in-the-heart-of-software-9780321125217), Addison-Wesley, 2003.
