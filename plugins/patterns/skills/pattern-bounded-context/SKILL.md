---
name: pattern-bounded-context
description: Reference for the bounded context pattern from domain-driven design - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when drawing component or service boundaries, weighing how to split a domain, or reviewing whether boundaries are in the right place.
---

# Bounded context

## What it is

A large domain is divided into **bounded contexts**: areas within which one model, and one vocabulary, applies consistently. The same word can mean different things in different contexts (a "customer" in sales and in support). A **context map** shows how contexts relate: shared kernel, customer-supplier, conformist, anti-corruption layer, published language, and so on.

## Forces it answers

- **Clear boundaries** for components, modules, services and teams.
- **Model integrity:** each context's model stays coherent instead of becoming one bloated shared model.
- **Team autonomy** aligned with contexts.

## When it fits

- Large or complex domains with several teams or subdomains.
- Deciding where module or service boundaries go, for a modular monolith or microservices.
- Integrations where two systems use the same words differently.

## When not to use it, and the simpler alternative

- **Simpler alternative:** one shared model, for a small domain that one team understands fully.
- Skip formal context mapping for simple applications whose domain has no real internal seams.

## Costs and risks

- Finding good boundaries takes domain knowledge and iteration; early boundaries are often wrong.
- Translation between contexts adds code at every integration point.
- Duplicated concepts across contexts can feel wasteful.

## What it means for the design

- Each bounded context is a candidate component, and often owns one module or service.
- Relationships on the context map become contracts, with an explicit translation where models differ.
- Each context owns the data of its model; another context holds only its own translated view.

## What it leaves to component design

The model inside each context, its aggregates and entities, and the translation code at its edges.

## Source

- Eric Evans, [*Domain-Driven Design: Tackling Complexity in the Heart of Software*](https://www.informit.com/store/domain-driven-design-tackling-complexity-in-the-heart-of-software-9780321125217), Addison-Wesley, 2003.
