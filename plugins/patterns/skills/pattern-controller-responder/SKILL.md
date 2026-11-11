---
name: pattern-controller-responder
description: Reference for the controller-responder (primary-replica) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing controller-responder or primary-replica replication, or reviewing a design that uses it.
---

# Controller-responder (primary-replica)

## What it is

One **controller** coordinates a group of **responders**. The name covers two related uses, formerly both called master-slave:

- **Dividing work**, the original pattern: the controller splits a task into parts, hands them to identical responders, and combines their results. Used for parallel computation and for fault tolerance, where several responders compute the same result and the controller compares them.
- **Replicating data**, the more common use today: the controller (primary) accepts all writes, and responders (replicas) hold copies of its data, kept up to date by replication, and serve reads. Responders never change the controller's data.

The rest of this skill covers both; where they differ, it says which.

## Forces it answers

- **Read scale:** reads spread across responders without loading the controller.
- **Availability of reads** and a warm standby that can be promoted if the controller fails.
- **Isolation:** heavy reads, backups or reports run on a responder without affecting the controller.
- **Parallelism** (dividing work): a large task finishes sooner when its parts run on several responders.

## When it fits

- Database replication with one writer and several readers.
- Work distribution where one coordinator assigns tasks to workers and collects results.
- Reads that tolerate slightly stale data.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a single instance with backups, when one machine handles the load and a restore window is acceptable.
- It does not scale writes; when writes outgrow one controller, look at sharding.
- Skip it when every read must see the latest write and the replication lag cannot be hidden.

## Costs and risks

- The controller is a single point of failure for writes; failover must be designed and tested, or a controller failure can lose recent writes and need a restart.
- Replication lag makes replica reads stale.
- Promotion and split-brain handling add operational complexity.

## What it means for the design

- One controller component and one or more responder instances; usually the same component deployed in two roles.
- Contracts: the replication or task-assignment protocol, and how clients pick the controller for writes and responders for reads.
- The controller owns the data. Responders hold read-only copies.

## What it leaves to component design

Synchronous or asynchronous replication, the failover procedure, read routing, and lag monitoring.

## Source

- Frank Buschmann, Regine Meunier, Hans Rohnert, Peter Sommerlad and Michael Stal, [*Pattern-Oriented Software Architecture, Volume 1: A System of Patterns*](https://www.wiley.com/en-us/Pattern-Oriented+Software+Architecture%2C+Volume+1%2C+A+System+of+Patterns-p-9780471958697), Wiley, 1996, "Master-Slave".
