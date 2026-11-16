---
type: Entity
title: "Netflix"
description: Streaming company whose Tudum site is a 2025 case study in replacing a lagging CQRS read path.
resource: https://netflixtechblog.com/
tags: [org, cqrs]
aliases: [Netflix]
timestamp: 2026-11-15T00:00:00Z
---

# Summary
Netflix's Tudum fan site used [[pattern-cqrs]] with Kafka and a Cassandra read store, which left editors waiting
minutes to preview changes. In 2025 it moved the read path to RAW Hollow, an embedded in-memory store
with per-request strong consistency, cutting home page construction from about 1.4 s to 0.4 s.
Appears in [[research-pattern-cqrs]].
