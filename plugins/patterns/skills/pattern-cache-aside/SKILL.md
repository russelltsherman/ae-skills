---
name: pattern-cache-aside
description: Reference for the cache-aside pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when adding a cache in front of a data store, or reviewing a design that caches data.
---

# Cache-aside

## What it is

The application looks for data in a cache first. On a miss, it reads from the data store, puts the result in the cache, and returns it. On a write, it updates the store and invalidates or updates the cached entry. The cache holds only copies; the store remains the source of truth.

## Forces it answers

- **Read latency and throughput** for frequently read data.
- **Reduced load** on the data store.

## When it fits

- Read-heavy data that changes rarely and tolerates short staleness.
- A data store that is slow, expensive or rate-limited.

## When not to use it, and the simpler alternative

- **Simpler alternative:** no cache, with better indexes or queries, or the store's own caching, until a target says reads are too slow.
- Skip it for data that must always be current, or that is rarely read twice.

## Costs and risks

- Stale data between a write and invalidation.
- Cache invalidation is famously error-prone.
- Cold caches after restarts; stampedes when popular entries expire.
- A cache cluster to run when it is a separate service.

## What it means for the design

- Usually inside one component; a shared cache service may appear as infrastructure.
- No new contracts between components.
- The data store's owner remains the owner; the cache holds disposable copies that only the owner should write or invalidate.

## What it leaves to component design

Keys, expiry times, invalidation strategy, and cache technology.

## Source

- Alex Homer, John Sharp, Larry Brader, Masashi Narumoto and Trent Swanson, *Cloud Design Patterns: Prescriptive Architecture Guidance for Cloud Applications*, Microsoft patterns & practices, 2014, <https://learn.microsoft.com/en-us/previous-versions/msp-n-p/dn568099(v=pandp.10)>, "Cache-Aside Pattern".
