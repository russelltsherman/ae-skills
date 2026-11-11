---
name: pattern-deployment-stamps
description: Reference for the deployment stamps pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when scaling a system by deploying multiple independent copies (stamps or cells), or reviewing a design that does.
---

# Deployment stamps

## What it is

The whole system, or a large part of it, is deployed as several independent copies called **stamps** (or cells or scale units), each serving a subset of users or tenants. A routing layer sends each request to its stamp. Capacity grows by adding stamps rather than by growing one deployment.

## Forces it answers

- **Scale beyond one deployment's limits.**
- **Blast-radius control:** a failure or bad release affects one stamp.
- **Data residency:** stamps in specific regions.

## When it fits

- Multi-tenant SaaS at large scale.
- Systems with regional data requirements.
- Gradual rollouts across stamps.

## When not to use it, and the simpler alternative

- **Simpler alternative:** one deployment that scales horizontally, until it hits a real limit.
- Skip it when users must share data across stamps constantly.

## Costs and risks

- Operating many copies: deployment, monitoring and upgrades across all stamps.
- Moving tenants between stamps is a migration.
- Cross-stamp features and reporting need extra design.

## What it means for the design

- The stamp is a unit of deployment containing many components; the router is a component of its own.
- Contracts are unchanged inside a stamp; the router's mapping is a new contract.
- Each stamp owns the data of its tenants; global data needs an explicit owner outside the stamps.

## What it leaves to component design

Stamp size, tenant-to-stamp mapping, deployment automation and stamp health checks.

## Source

- Microsoft, Azure Architecture Center, ["Deployment Stamps pattern"](https://learn.microsoft.com/azure/architecture/patterns/deployment-stamp) (the current version).
