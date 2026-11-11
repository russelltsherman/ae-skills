---
name: pattern-retry
description: Reference for the retry with backoff pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when handling transient failures in calls to other components or services, or reviewing a design's failure handling.
---

# Retry with backoff

## What it is

When a call fails with an error that is likely transient, such as a timeout, a dropped connection or a throttling response, the caller tries again after a delay. The delay grows with each attempt (**exponential backoff**) and is randomized (**jitter**) so that many callers do not retry in lockstep. Attempts are capped, and non-transient errors are not retried.

## Forces it answers

- **Reliability** in the face of brief network and service glitches.
- **Simplicity:** the cheapest resilience measure, often the first one to add.

## When it fits

- Any remote call to a service, database or API that can fail briefly.
- Operations that are idempotent or can be made so.

## When not to use it, and the simpler alternative

- **Simpler alternative:** fail immediately and let the user or caller try again, when failures are rare and the caller is interactive.
- Do not retry non-idempotent operations without an idempotency key, or errors that will not go away, such as validation failures.

## Costs and risks

- Retries multiply load on a struggling dependency; without a circuit breaker they can make an outage worse.
- Retries at several layers multiply each other.
- Added latency on failure paths.

## What it means for the design

- Inside the calling component; no new components.
- Contracts should say which operations are idempotent and which errors are retryable.
- No change to data ownership.

## What it leaves to component design

Which errors are retried, attempt limits, backoff and jitter settings, and idempotency keys.

## Source

- Alex Homer, John Sharp, Larry Brader, Masashi Narumoto and Trent Swanson, *Cloud Design Patterns: Prescriptive Architecture Guidance for Cloud Applications*, Microsoft patterns & practices, 2014, <https://learn.microsoft.com/en-us/previous-versions/msp-n-p/dn568099(v=pandp.10)>, "Retry Pattern".
