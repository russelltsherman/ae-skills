---
name: pattern-queue-based-load-leveling
description: Reference for the queue-based load leveling and competing consumers patterns - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a queue between producers and workers to absorb load spikes or scale processing, or reviewing a design that uses one.
---

# Queue-based load leveling and competing consumers

## What it is

Producers put work items on a queue instead of calling the worker directly. One or more workers (**competing consumers**) take items from the queue at their own pace. The queue absorbs bursts, so the worker sees a steady load, and adding workers increases throughput.

## Forces it answers

- **Availability under load spikes:** the producer is not slowed or failed by a busy worker.
- **Throughput and scale:** add consumers to process more.
- **Resilience:** work waits in the queue while a worker is down.

## When it fits

- Work that can be done asynchronously: email, image processing, report generation, order fulfillment steps.
- Bursty producers in front of a resource with limited capacity.

## When not to use it, and the simpler alternative

- **Simpler alternative:** call the worker directly with a timeout, when load is steady and the caller needs the result now.
- It does not fit when the caller must have the answer within the request.

## Costs and risks

- Results arrive later: callers need a way to learn the outcome.
- At-least-once delivery means duplicates; consumers must be idempotent.
- Ordering is lost with competing consumers unless partitioned.
- Queue depth and poison messages need monitoring.

## What it means for the design

- The queue may be a component or platform service; producers and workers are components.
- The work item format is a contract between producer and workers.
- The producer owns the request; the worker owns the result it produces.

## What it leaves to component design

Queue technology, visibility timeouts, retries and dead letters, scaling rules and idempotency.

## Source

- Alex Homer, John Sharp, Larry Brader, Masashi Narumoto and Trent Swanson, *Cloud Design Patterns: Prescriptive Architecture Guidance for Cloud Applications*, Microsoft patterns & practices, 2014, <https://learn.microsoft.com/en-us/previous-versions/msp-n-p/dn568099(v=pandp.10)>, "Queue-based Load Leveling Pattern" and "Competing Consumers Pattern".
