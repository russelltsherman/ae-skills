---
type: Concept
title: "CQRS (Command Query Responsibility Segregation)"
description: Separate models for writes (commands) and reads (queries), applied selectively to bounded contexts that benefit.
tags: [pattern, web, backend, cqrs]
aliases: [CQRS, Command Query Responsibility Segregation]
timestamp: 2026-11-15T00:00:00Z
---

# Summary
CQRS splits one model into a command (write) model and a query (read) model. It works over one
database or many. Read replicas alone are not CQRS. Apply it per bounded context; simple CRUD
domains should stay CRUD. Splitting stores brings eventual consistency. [[org-netflix]]'s Tudum kept CQRS
but swapped a lagging Kafka/Cassandra read path for an in-memory store. Source: [[research-pattern-cqrs]].

# Related
Used for cross-service queries in [[pattern-microservices]] (per [[research-pattern-microservices]]).
[[pattern-incremental-static-regeneration]] faces the same stale-read trade-off in its page cache (per
[[research-pattern-incremental-static-regeneration]]).
