---
name: pattern-throttling
description: Reference for the throttling (rate limiting) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing throttling or rate limiting, or reviewing a design that uses it.
---

# Throttling (rate limiting)

## What it is

A component limits how fast work flows into it, or into a resource it protects. Requests over the limit are rejected, delayed or queued. Limits can apply per client, per operation or overall, using algorithms such as a token bucket or a sliding window.

## Forces it answers

- **Availability under overload,** including traffic spikes and abusive or denial-of-service traffic.
- **Fairness** between clients sharing a service.
- **Cost control** for resources billed by use, such as cloud services and paid APIs.

## When it fits

- Public or shared APIs with many clients.
- Protecting a fragile or expensive downstream dependency.
- Usage tiers or quotas that are part of a product.

## When not to use it, and the simpler alternative

- **Simpler alternative:** autoscaling or added capacity when load is legitimate and growth is affordable, or a fixed-size work queue in front of the resource.
- Skip it for internal paths with one trusted caller and predictable load.

## Costs and risks

- Limits set too low reject good traffic; too high and they protect nothing.
- Distributed limits need shared state, such as a fast store, which can itself fail.
- Clients must handle rejection well, with backoff, or they make overload worse; it pairs with circuit breakers on the client side.

## What it means for the design

- Lives in the protected component or in a gateway in front of it.
- The contract gains a defined "too many requests" outcome and, often, published limits.
- No change to data ownership. Counters for distributed limits are owned by the throttling component.

## What it leaves to component design

The algorithm, the limit values and their keys, where counters are stored, and the response clients receive when limited.

## Source

- Alex Homer, John Sharp, Larry Brader, Masashi Narumoto and Trent Swanson, *Cloud Design Patterns: Prescriptive Architecture Guidance for Cloud Applications*, Microsoft patterns & practices, 2014, <https://learn.microsoft.com/en-us/previous-versions/msp-n-p/dn568099(v=pandp.10)>, "Throttling Pattern".
