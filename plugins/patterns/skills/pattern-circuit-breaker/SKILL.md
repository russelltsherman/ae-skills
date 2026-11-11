---
name: pattern-circuit-breaker
description: Reference for the circuit breaker architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a circuit breaker or reviewing a design that uses one.
---

# Circuit breaker

## What it is

A caller wraps its calls to a remote dependency in a breaker that counts failures. While calls succeed, the breaker is **closed** and passes them through. After too many failures it **opens** and fails calls immediately, or sends them to a fallback, without touching the dependency. After a cool-down it goes **half-open** and lets a few trial calls through: if they succeed it closes, otherwise it opens again.

## Forces it answers

- **Availability of the caller** when a dependency is down or slow: failing fast frees threads, connections and queues that would otherwise pile up waiting.
- **Containing cascading failure** across a chain of synchronous calls.
- **Recovery of the dependency**, which gets room to recover instead of a flood of retries.

## When it fits

- A component makes synchronous calls to a dependency that can fail or slow down independently of it.
- The caller has something useful to do when the dependency is unavailable: a cached value, a degraded response, a clear error.
- Call volume is high enough that waiting on a failing dependency exhausts the caller's resources.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a timeout on every remote call, plus bounded retries with backoff. That alone handles most failures in low-volume systems.
- Skip it for calls inside one process, or when the caller has no fallback and failing slowly or quickly makes no difference to its users.
- It does not fit asynchronous, queue-based communication, where the queue already decouples the two sides.

## Costs and risks

- Thresholds, windows and cool-downs need tuning; wrong values trip on normal noise or never trip at all.
- Open breakers hide failures unless their state is monitored and alerted on.
- Testing needs a way to inject dependency failures; many teams rely on a library or a service mesh to provide breakers consistently.

## What it means for the design

- Belongs to the **caller**, one breaker per dependency (sometimes per operation).
- The contract between caller and dependency gains a defined "unavailable" outcome that callers of the caller may see.
- No change to data ownership. A fallback cache, if any, is owned by the caller.

## What it leaves to component design

Thresholds and timings, which calls are wrapped, the fallback behavior, whether a library or a mesh provides the breaker, and how breaker state is reported.

## Source

- Michael T. Nygard, *Release It! Design and Deploy Production-Ready Software*, Pragmatic Bookshelf, 2007; [2nd edition](https://pragprog.com/titles/mnee2/release-it-second-edition/) 2018.
