---
name: pattern-microkernel
description: Reference for the microkernel (plug-in) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a microkernel or plug-in architecture, or reviewing a design that uses one.
---

# Microkernel (plug-in)

## What it is

A minimal **core system** provides the essential functions and a stable extension contract. Features are added as **plug-ins** that the core discovers through a registry and calls through that contract. Plug-ins are independent of each other and can be added, removed or replaced without changing the core.

## Forces it answers

- **Extensibility:** new features or customer-specific behavior without changing the core.
- **Isolation** of volatile or optional features.
- **Product variants** assembled from the same core.

## When it fits

- Tools and platforms extended by third parties: IDEs, browsers, build tools.
- Products customized per customer or region, such as rules engines or claims processing.
- Systems whose core is stable but whose features vary.

## When not to use it, and the simpler alternative

- **Simpler alternative:** configuration flags or a few conditional code paths, when the set of variations is small and known.
- It fits poorly when most features need deep access to each other or to the core's internals.

## Costs and risks

- Designing a plug-in contract that stays stable is hard; changing it breaks every plug-in.
- Plug-in discovery, versioning and compatibility testing add work.
- Badly behaved plug-ins can affect the core unless isolated.

## What it means for the design

- The core is one component; plug-ins may be components or deployable units of their own.
- The plug-in contract is the central contract, owned by the core.
- The core owns shared data; each plug-in owns only its own configuration and data.

## What it leaves to component design

The registry and loading mechanism, plug-in isolation, the exact extension points, and versioning.

## Source

- Frank Buschmann, Regine Meunier, Hans Rohnert, Peter Sommerlad and Michael Stal, [*Pattern-Oriented Software Architecture, Volume 1: A System of Patterns*](https://www.wiley.com/en-us/Pattern-Oriented+Software+Architecture%2C+Volume+1%2C+A+System+of+Patterns-p-9780471958697), Wiley, 1996, "Microkernel".
