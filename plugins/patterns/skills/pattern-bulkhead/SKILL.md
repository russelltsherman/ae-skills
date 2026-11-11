---
name: pattern-bulkhead
description: Reference for the bulkhead pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when isolating resources so one failing part cannot exhaust the rest, or reviewing a design's failure isolation.
---

# Bulkhead

## What it is

Resources such as thread pools, connection pools, processes or whole instances are divided into isolated groups, like the watertight compartments of a ship. Each dependency, client or workload uses its own group, so if one is overwhelmed or hangs, only its group is exhausted and the rest keeps working.

## Forces it answers

- **Availability:** a failure or overload in one area does not spread.
- **Fairness:** a noisy client or workload cannot starve others.

## When it fits

- A component that calls several dependencies of different reliability.
- Services shared by tenants or clients with different priorities.
- Pairs with circuit breaker and throttling.

## When not to use it, and the simpler alternative

- **Simpler alternative:** timeouts on every call and one shared pool, when dependencies are few and reliable.
- Skip it when there is only one dependency and one kind of work.

## Costs and risks

- Partitioned resources are used less efficiently; sizing each partition takes measurement.
- More configuration to manage and monitor.

## What it means for the design

- Usually inside one component; at the architecture level it may mean separate deployments for critical and non-critical workloads.
- No new contracts.
- No change to data ownership.

## What it leaves to component design

Which resources to partition, pool sizes, and how partitions are monitored.

## Source

- Michael T. Nygard, *Release It! Design and Deploy Production-Ready Software*, Pragmatic Bookshelf, 2007; [2nd edition](https://pragprog.com/titles/mnee2/release-it-second-edition/) 2018.
