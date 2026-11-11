---
name: pattern-multi-tenancy
description: Reference for the multi-tenancy patterns (silo, pool and bridge) - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when designing how a SaaS system separates tenants, or reviewing a design's tenant isolation.
---

# Multi-tenancy: silo, pool and bridge

## What it is

One system serves many tenants (customer organizations). How resources are shared is chosen per layer:

- **Silo:** each tenant gets dedicated resources, such as its own database or deployment.
- **Pool:** tenants share resources, with tenant identity carried on every request and every row.
- **Bridge** (hybrid): some layers pooled, others siloed, or premium tenants siloed and the rest pooled.

## Forces it answers

- **Cost efficiency** of shared resources (pool).
- **Isolation** for security, compliance, performance and data residency (silo).
- **Operability** at scale: onboarding and upgrades for many tenants.

## When it fits

- Any software sold as a service to many organizations.
- Mixed customer bases with different isolation or compliance needs (bridge).

## When not to use it, and the simpler alternative

- **Simpler alternative:** a single-tenant deployment per customer, when there are few customers.
- Skip silo for many small tenants: the operational cost per tenant becomes prohibitive.

## Costs and risks

- Pool: noisy neighbours, and a bug can leak data between tenants.
- Silo: cost and operational overhead grow with every tenant.
- Moving a tenant between models later is a migration.

## What it means for the design

- Tenant management (onboarding, routing, configuration) often becomes a component.
- Every contract must carry or derive tenant identity.
- Data ownership is per tenant as well as per component; decide where tenant data may be stored and how it is isolated.

## What it leaves to component design

Tenant identification, row-level security or schema separation, routing, and per-tenant limits.

## Source

- Tod Golding, AWS, ["SaaS Architecture Fundamentals"](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/full-stack-silo-and-pool.html), 2022, and the AWS Well-Architected SaaS Lens, ["Silo, pool, and bridge models"](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html).
