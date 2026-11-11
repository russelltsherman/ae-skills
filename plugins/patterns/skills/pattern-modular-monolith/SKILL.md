---
name: pattern-modular-monolith
description: Reference for the modular monolith architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a modular monolith, comparing it with microservices, or reviewing a design that uses one.
---

# Modular monolith

## What it is

The system is one deployable unit, built as a set of modules with strict boundaries. Each module owns one business capability and its data, exposes a public interface, and hides everything else. Modules call each other in-process through those interfaces, or through in-process events, never by reaching into another module's internals or tables. The logical boundaries are those of microservices; the physical deployment is one process.

## Forces it answers

- **Modularity without distribution:** clear ownership and independent change, without network failures, distributed transactions or per-service operations.
- **Simple deployment and operations:** one build, one release, one thing to monitor.
- **A path to microservices:** a module with a clean boundary can later be extracted into its own service if a real need appears.

## When it fits

- One team or a few teams, where independent deployment is not yet the bottleneck.
- A new product whose domain boundaries are still being learned: moving a boundary inside one codebase is cheap.
- Systems that need modularity but whose load does not need parts to scale independently.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a plain monolith, possibly layered, for small systems where a single team understands all of it.
- It stops fitting when teams are blocked on each other's releases, or when parts genuinely need independent scaling, availability or technology; then extract those parts as services.

## Costs and risks

- Boundaries are kept by discipline and tooling, not by the network: without architecture tests or build rules, modules erode into a big ball of mud.
- Everything still deploys together, so one module's bad release takes down all of them.
- All modules share one runtime and usually one technology stack.
- A shared database invites cross-module queries; separate schemas per module take effort.

## What it means for the design

- Each module is a component, deployed together as one unit; the deployment is a separate decision from the boundaries.
- Contracts: each module's public interface and in-process events.
- Each module owns its data exclusively, ideally in its own schema; no module reads another's tables.

## What it leaves to component design

Each module's internal structure (layered, hexagonal or vertical slice), how boundaries are enforced in the build, and in-process messaging details.

## Source

- Simon Brown, ["Modular Monoliths"](https://gotopia.tech/sessions/515/modular-monoliths), GOTO Berlin 2018.
