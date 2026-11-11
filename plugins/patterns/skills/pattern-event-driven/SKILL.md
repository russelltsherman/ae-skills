---
name: pattern-event-driven
description: Reference for event-driven architecture (EDA) - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing an event-driven design or reviewing a design that uses events between components.
---

# Event-driven architecture (EDA)

## What it is

Components communicate by producing and reacting to **events**: records that something has happened, such as "order placed". A producer emits an event without knowing who reacts; consumers react on their own schedule. Events usually travel through a broker or event stream. "Event-driven" covers several distinct styles, which should be named explicitly:

- **Event notification:** the event says something changed; consumers call back for details if they need them.
- **Event-carried state transfer:** the event carries the data, so consumers keep their own copy and never call back.
- **Event sourcing:** a component stores its own state as events (see the event sourcing pattern).
- **CQRS** often rides on events to update read models (see the CQRS pattern).

Publish-subscribe is the usual messaging mechanism underneath.

## Forces it answers

- **Loose coupling:** producers do not depend on consumers, so new reactions are added without changing the producer.
- **Responsiveness and scale:** work after the event happens asynchronously, absorbing load spikes.
- **Availability:** a consumer can be down without blocking the producer.

## When it fits

- Many components react to the same business facts.
- Workflows that span components and can proceed asynchronously.
- Integration between systems owned by different teams.

## When not to use it, and the simpler alternative

- **Simpler alternative:** direct synchronous calls between components, or a single work queue, when there are few interactions and the caller needs the answer now.
- Skip it when the flow must be easy to follow end to end, when strong consistency is required immediately, or when the team lacks operational tooling for brokers and tracing.

## Costs and risks

- The overall flow is implicit: hard to see, debug and test without tracing.
- Eventual consistency between components; ordering, duplicates and lost events must be designed for.
- Event schemas become long-lived contracts; versioning them is hard once many consumers exist.
- Event notification can cause chatty callbacks; event-carried state transfer duplicates data.
- Broker infrastructure to run.

## What it means for the design

- Producers, consumers, and a broker or event stream as a component or platform service.
- Each event type is a contract, owned by the producer.
- The producer owns the facts in its events. A consumer owns only the copies and decisions it derives from them; it never becomes the source of truth for the producer's data.

## What it leaves to component design

Broker technology, delivery guarantees, idempotency, retry and dead-letter handling, and serialization.

## Source

- Martin Fowler, ["What do you mean by 'Event-Driven'?"](https://martinfowler.com/articles/201701-event-driven.html), 2017.
