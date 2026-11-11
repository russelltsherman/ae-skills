---
name: pattern-api-gateway
description: Reference for the API gateway and backends for frontends (BFF) patterns - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a single entry point for clients, per-client backends (BFF), or reviewing how clients reach a set of services.
---

# API gateway and backends for frontends

## What it is

Clients call one **API gateway** instead of many services. The gateway routes requests, and often handles authentication, rate limiting, request aggregation and protocol translation. In the **backends for frontends** (BFF) variant, each kind of client, such as web, mobile or partner, gets its own gateway shaped to its needs and usually owned by that client's team.

## Forces it answers

- **Simpler clients:** one endpoint, fewer round trips, a stable public API.
- **Encapsulation:** internal services can change and move without breaking clients.
- **Cross-cutting concerns** handled in one place.
- With BFF, **each client gets the API it needs** without bloating a shared one.

## When it fits

- Several backend services behind one client-facing API.
- Mobile clients that need aggregated, smaller responses.
- Different client types with different needs (BFF).

## When not to use it, and the simpler alternative

- **Simpler alternative:** clients call a single backend directly, when there is only one service, or a plain reverse proxy for routing alone.
- Skip BFF when all clients need the same API; one gateway is enough.

## Costs and risks

- The gateway is another component to build, run and scale, and a potential bottleneck and single point of failure.
- Business logic creeping into the gateway couples it to the services.
- BFFs duplicate logic between frontends.

## What it means for the design

- The gateway, or each BFF, is a component.
- The gateway owns the public client contract; services' internal APIs become contracts used only by the gateway.
- The gateway should own no business data; at most caches and rate-limit counters.

## What it leaves to component design

Routing rules, aggregation, authentication, and the gateway product or framework.

## Source

- Chris Richardson, ["Pattern: API Gateway / Backends for Frontends"](https://microservices.io/patterns/apigateway.html), microservices.io.
- Sam Newman, ["Backends For Frontends"](https://samnewman.io/patterns/architectural/bff/), 2015, which credits Phil Calçado with the name.
