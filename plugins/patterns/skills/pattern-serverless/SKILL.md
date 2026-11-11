---
name: pattern-serverless
description: Reference for the serverless architecture pattern (functions as a service and backend as a service) - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing serverless or reviewing a design that uses it.
---

# Serverless

## What it is

The system runs without servers the team manages. It combines two things:

- **Functions as a service (FaaS):** custom code runs in short-lived, provider-managed containers, started on demand by events such as HTTP requests, queue messages, file uploads or schedules, and scaled automatically, down to zero.
- **Backend as a service (BaaS):** managed third-party services, such as authentication, databases, storage and messaging, replace components the team would otherwise build and run.

Billing follows actual use rather than provisioned capacity.

## Forces it answers

- **Operational cost and effort:** no servers to patch, size or scale.
- **Cost that tracks load,** including near-zero cost when idle.
- **Elastic scale** for spiky or unpredictable traffic.
- **Lead time:** less infrastructure to build before shipping.

## When it fits

- Event-driven workloads: file processing, webhooks, scheduled jobs, glue between managed services.
- Spiky or low-average traffic, where paying for idle servers is wasteful.
- Small teams that want to spend little time on operations.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a single managed application platform or container service running one long-lived process, which avoids splitting the system into functions.
- Skip it for steady high load (where reserved servers are cheaper), long-running or stateful work, latency-sensitive paths that cannot tolerate cold starts, and systems that must stay portable between providers.

## Costs and risks

- Vendor dependence: functions, triggers and managed services tie the system to one provider.
- Cold-start latency, execution time limits, and concurrency limits.
- State must live in external services; local testing and debugging are harder.
- Many small functions spread logic thinly and are hard to see as a whole.
- Costs can jump unexpectedly under heavy or runaway load.

## What it means for the design

- Components may be groups of functions plus the managed services they use; each managed service is an external system the design depends on.
- Contracts are often provider-defined: event formats from triggers, managed service APIs.
- Data lives in managed services; decide which component owns each store, since any function with credentials can technically write it.

## What it leaves to component design

Function granularity, runtime and memory settings, trigger configuration, packaging, local testing, and observability.

## Source

- Mike Roberts, ["Serverless Architectures"](https://martinfowler.com/articles/serverless.html), martinfowler.com, 2018.
