---
name: pattern-strangler
description: Reference for the strangler fig architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing an incremental replacement of a legacy system, or reviewing a design that uses one.
---

# Strangler fig

## What it is

A legacy system is replaced piece by piece. An intermediary, such as a proxy, gateway or facade, sits in front of it and routes each request either to the old system or to the new one. As features are rebuilt, more routes move to the new system, until the old one handles nothing and is retired.

## Forces it answers

- **Lower migration risk:** each step is small, can be released on its own, and can be rolled back.
- **Continuous delivery of value** during a migration instead of one big cut-over.
- **Business continuity:** the old system keeps working throughout.

## When it fits

- Replacing a large legacy system that cannot be rewritten in one go.
- Requests that can be routed by URL, operation or user, so features can move one at a time.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a straight rewrite and cut-over, when the system is small enough to replace in one release, or improving the legacy system in place.
- It is hard to apply when the old system cannot be intercepted, or when its features share data so tightly that none can move alone.

## Costs and risks

- The intermediary needs careful routing and network management, and is a point of failure.
- Data shared between old and new systems must be synchronized while both are live.
- Every step needs a rollback plan.
- Migrations stall halfway, leaving two systems to run indefinitely.

## What it means for the design

- Three components during the migration: the intermediary, the legacy system and the new system.
- The intermediary's routing rules become a contract to manage; the external contract should stay stable for clients.
- Data ownership moves from the legacy system to the new one, feature by feature: each move is an architecture decision.

## What it leaves to component design

The routing rules and mechanism, data synchronization while both run, and each feature's rebuild.

## Source

- Martin Fowler, ["StranglerApplication"](https://martinfowler.com/bliki/OriginalStranglerFigApplication.html), 2004.
