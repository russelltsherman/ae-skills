---
name: pattern-sharding
description: Reference for the sharding (horizontal partitioning) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing sharding or reviewing a design that uses it.
---

# Sharding

## What it is

A dataset is split horizontally into shards, each holding a subset of the records and stored on its own instance. A shard key, such as a customer or tenant ID, decides which shard holds each record. A routing layer or the client sends each query to the right shard.

## Forces it answers

- **Write and storage scale** beyond what one instance can hold or handle.
- **Query latency** for queries that touch only one shard.
- **Fault isolation:** losing a shard affects only part of the data.

## When it fits

- Data or write volume has outgrown the largest practical single instance, or soon will.
- Most queries naturally target one key, such as one tenant or one user.
- Multi-tenant systems with large, independent tenants.

## When not to use it, and the simpler alternative

- **Simpler alternative:** scale up the instance, add indexes, add read replicas (controller-responder), or archive old data.
- Skip it while one instance still meets the targets, and when queries regularly need data from many shards.

## Costs and risks

- Queries and transactions across shards are slow or unsupported.
- A bad shard key causes hot shards; changing it later means moving all the data.
- Rebalancing, backups and schema changes have to work across every shard.
- Needs skilled database operations.

## What it means for the design

- The owning component stays the same, but its store becomes many instances plus routing.
- Contracts may need to carry the shard key so requests can be routed.
- Data ownership is unchanged at the component level; each shard holds part of the same component's data.

## What it leaves to component design

The shard key, the routing approach, rebalancing, and how operations that span shards are handled.

## Source

- Alex Homer, John Sharp, Larry Brader, Masashi Narumoto and Trent Swanson, *Cloud Design Patterns: Prescriptive Architecture Guidance for Cloud Applications*, Microsoft patterns & practices, 2014, <https://learn.microsoft.com/en-us/previous-versions/msp-n-p/dn568099(v=pandp.10)>, "Sharding Pattern".
