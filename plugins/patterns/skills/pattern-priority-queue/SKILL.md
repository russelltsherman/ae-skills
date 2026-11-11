---
name: pattern-priority-queue
description: Reference for the priority queue pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when some work must be processed before other work, or reviewing a queue-based design with service levels.
---

# Priority queue

## What it is

Work items carry a priority, and higher-priority items are processed first. This is done either with one queue that orders by priority or with separate queues per priority, where more consumers serve the high-priority queues.

## Forces it answers

- **Service levels:** important or paying customers' work finishes first.
- **Responsiveness** for urgent work under load.

## When it fits

- Mixed workloads with different urgency, such as interactive and batch.
- Tiered service levels.

## When not to use it, and the simpler alternative

- **Simpler alternative:** one first-in-first-out queue with enough consumers, when all work has similar urgency.
- Skip it when the broker cannot order by priority and separate queues would be overkill.

## Costs and risks

- Low-priority work can starve under sustained load.
- More queues and consumer configuration to manage.
- Priority inflation: every producer marks its work urgent.

## What it means for the design

- Queues as infrastructure; producers and consumers as components.
- Work item contracts gain a priority field and rules for who may set it.
- No change to data ownership.

## What it leaves to component design

Queue layout, consumer allocation per priority, and starvation protection.

## Source

- Microsoft, Azure Architecture Center, ["Priority Queue pattern"](https://learn.microsoft.com/azure/architecture/patterns/priority-queue).
