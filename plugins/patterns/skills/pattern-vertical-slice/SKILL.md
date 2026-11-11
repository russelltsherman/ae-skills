---
name: pattern-vertical-slice
description: Reference for vertical slice architecture - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing vertical slices against layered or domain-centric structures, or reviewing a design that uses them.
---

# Vertical slice architecture

## What it is

Code is organized by feature rather than by technical layer. Each slice handles one request, such as one command or one query, from the entry point down to the data store, and contains everything that request needs. The aim is to minimize coupling between slices and maximize coupling within a slice. Each slice may choose its own approach: one uses a rich domain model, another a simple transaction script, another a direct query. Sharing between slices is kept to a minimum: rather than one slice calling another, code they genuinely share is refactored into a common place once duplication actually appears.

## Forces it answers

- **Change locality:** a feature change touches one slice, not every layer.
- **Fitting the approach to the problem:** simple features stay simple, complex ones get more structure.
- **Fast onboarding:** a developer can understand one feature without learning the whole system's abstractions.

## When it fits

- Applications whose work divides naturally into requests or commands and queries, such as web APIs.
- Teams frustrated by changes that ripple through every layer, or by abstractions most features do not need.
- Often paired with CQRS-style command and query handling.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a plain layered structure, which most developers already know, for small applications.
- It fits poorly where most behavior lives in a shared, rich domain model that many features must use consistently; a domain-centric structure (hexagonal, onion or clean) may fit better.

## Costs and risks

- Duplication between slices, and inconsistent styles from slice to slice.
- Shared logic needs a deliberate home, or slices start calling each other.
- Needs guardrails, such as conventions, architecture tests and a reference slice, to stay coherent.

## What it means for the design

- A structure inside one component; at the architecture level it matters only in that each contract operation maps naturally to one slice.
- No new contracts between components.
- No change to data ownership; slices share the component's data store, so its schema needs one owner within the team.

## What it leaves to component design

Slice boundaries and naming, how requests are dispatched, where shared code lives, and the guardrails that keep slices consistent.

## Source

- Jimmy Bogard, ["Vertical Slice Architecture"](https://www.jimmybogard.com/vertical-slice-architecture/), 2018.
