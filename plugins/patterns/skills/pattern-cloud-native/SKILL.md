---
name: pattern-cloud-native
description: Reference for cloud-native architecture - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a cloud-native approach (containers, orchestration, service mesh, immutable infrastructure, declarative APIs) or reviewing a design that uses it.
---

# Cloud-native

## What it is

An approach to building systems that exploit dynamic cloud environments rather than a single pattern. The Cloud Native Computing Foundation's definition (v1.0, 2018) describes it as using containers, service meshes, microservices, immutable infrastructure and declarative APIs to build loosely coupled systems that are resilient, manageable and observable, combined with automation so engineers can make frequent, predictable changes. In practice that means:

- applications packaged as containers and run by an orchestrator such as Kubernetes;
- stateless processes configured from the environment, scaled horizontally;
- infrastructure described declaratively and replaced rather than patched;
- built-in health checks, metrics, logs and traces;
- continuous delivery.

It usually combines with microservices or serverless, but a single containerized application can be cloud-native too.

## Forces it answers

- **Resilience:** failed instances are replaced automatically.
- **Elastic scale** of stateless processes.
- **Frequent, low-risk releases** through automation and immutable deployments.
- **Portability** across providers that run the same orchestration platform.

## When it fits

- Systems that must scale horizontally, recover automatically and release often.
- Organizations with, or willing to build, platform and operations expertise.
- Many services sharing one deployment platform.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a managed platform-as-a-service, or a few virtual machines with a simple deployment script, for small systems with steady load.
- Skip running your own orchestration for a handful of services; the platform can cost more effort than the application.

## Costs and risks

- A large, fast-moving toolset: orchestrator, mesh, observability stack, delivery pipelines.
- Platform engineering is a job in its own right; misconfiguration is a common cause of outages and security gaps.
- Stateful workloads are harder to run well.
- Cost can grow unnoticed without capacity and spend monitoring.

## What it means for the design

- Usually a technology and platform decision at the architecture level, with the platform itself possibly a component.
- Contracts gain operational parts: health endpoints, configuration through the environment, telemetry formats.
- No change to data ownership, but state moves out of processes into managed or dedicated stores.

## What it leaves to component design

Container images, resource limits, probes, configuration, telemetry, and each component's deployment manifests.

## Source

- Cloud Native Computing Foundation, "CNCF Cloud Native Definition v1.0", 2018, which this skill follows.
