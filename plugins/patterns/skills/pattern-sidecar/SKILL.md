---
name: pattern-sidecar
description: Reference for the sidecar, ambassador and service mesh patterns - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing sidecars, ambassadors or a service mesh to handle cross-cutting networking and operations, or reviewing a design that uses them.
---

# Sidecar, ambassador and service mesh

## What it is

A **sidecar** is a helper process deployed next to each instance of an application, sharing its lifecycle and host, that adds a capability such as logging, configuration or TLS without changing the application. An **ambassador** is a sidecar that proxies the application's outbound calls, adding retries, circuit breaking or routing. A **service mesh** runs such proxies beside every service, with a control plane that configures them centrally.

## Forces it answers

- **Consistency:** cross-cutting concerns handled the same way for every service, in any language.
- **Separation:** application code stays free of networking and observability plumbing.
- **Central control** of traffic, security and telemetry (mesh).

## When it fits

- Many services in several languages that need the same networking, security and observability.
- Legacy applications that cannot be changed but need new capabilities.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a shared library in the application, when services use one language and are few.
- Skip a service mesh for a handful of services; its operational cost outweighs the benefit.

## Costs and risks

- Extra latency and resource use per instance.
- More moving parts to deploy, upgrade and debug; a mesh is a platform in itself.
- Failures in the proxy layer look like application failures.

## What it means for the design

- The mesh or sidecar platform is infrastructure, often a component of its own.
- Contracts are unchanged, but security and routing policies become managed configuration.
- No change to data ownership; the mesh owns only its configuration and telemetry.

## What it leaves to component design

Which concerns move into sidecars, proxy configuration, and the mesh product.

## Source

- Brendan Burns and David Oppenheimer, ["Design Patterns for Container-based Distributed Systems"](https://www.usenix.org/conference/hotcloud16/workshop-program/presentation/burns), HotCloud 2016, which names the sidecar and ambassador patterns.
