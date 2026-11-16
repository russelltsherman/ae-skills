---
type: Concept
title: "Incremental Static Regeneration"
description: Background regeneration of cached static pages.
tags: [pattern, web, rendering]
aliases: [ISR, Incremental Static Regeneration]
timestamp: 2026-11-15T00:00:00Z
---

# Summary
Serve a cached static page, regenerate it in the background after a revalidation window. Shares the
stale-read trade-off of an asynchronous [[pattern-cqrs]] read model. Source: [[research-pattern-incremental-static-regeneration]].
