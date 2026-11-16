---
type: Concept
title: "Vertical Slice Architecture"
description: Organise application code by feature, so each request's handler, data access and model live together.
tags: [pattern, web, backend]
aliases: [Vertical slice architecture, VSA, Vertical slices]
timestamp: 2026-11-15T00:00:00Z
---

# Summary
Vertical slice architecture organises code around features rather than technical layers: each
request (a command or query) gets its own handler that owns everything it needs, from input
model to data access ([[person-jimmy-bogard|Jimmy Bogard]], 2018). Coupling is kept within a slice
and minimised between slices. It suits feature-heavy web backends; shared domain logic needs
deliberate extraction. Source: [[research-pattern-vertical-slice]].
