---
name: pattern-geode
description: Reference for the geode pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when serving users globally from several regions with each region able to serve any request, or reviewing a multi-region active-active design.
---

# Geode

## What it is

The system is deployed to several geographic regions as **geodes**: each is a complete copy that can serve any request. Requests are routed to the nearest healthy geode, and data is replicated between geodes so all of them can read and write it (active-active).

## Forces it answers

- **Global latency:** users are served nearby.
- **Availability:** a region outage is absorbed by the others.

## When it fits

- Global user bases with tight latency targets.
- Very high availability targets that a single region cannot meet.

## When not to use it, and the simpler alternative

- **Simpler alternative:** one region with a content delivery network for static content, or active-passive failover to a second region.
- Skip it when data must be strongly consistent everywhere, or must stay in one region.

## Costs and risks

- Multi-region data replication with conflicts and eventual consistency.
- Significant cost: every region runs a full copy.
- Testing and operating failover across regions.

## What it means for the design

- Each geode is a full deployment of the system's components; global routing is a component.
- Contracts unchanged; clients must tolerate being routed to different regions.
- Data ownership per component is unchanged, but each store is replicated across regions with a conflict policy.

## What it leaves to component design

The replicated data store, conflict resolution, routing and health probes.

## Source

- Microsoft, Azure Architecture Center, ["Geode pattern"](https://learn.microsoft.com/azure/architecture/patterns/geodes).
