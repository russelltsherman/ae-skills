---
name: pattern-pub-sub
description: Reference for the publish-subscribe (pub-sub) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing pub-sub or event-driven messaging, or reviewing a design that uses it.
---

# Publish-subscribe (pub-sub)

## What it is

Publishers send messages to a topic without knowing who will receive them. Subscribers register interest in topics and receive every message published there. A broker in between routes, buffers and often stores the messages. It is the usual messaging mechanism under event-driven architecture (see that pattern).

## Forces it answers

- **Loose coupling:** publishers and subscribers can be added, removed or changed without touching each other.
- **Fan-out:** one event reaches many interested components.
- **Absorbing load spikes** through the broker's buffering, so subscribers work at their own pace.

## When it fits

- Several components need to react to the same event, and the publisher should not have to know them.
- Notifications, integration between systems, and event-driven workflows.
- Work that can happen asynchronously after the publisher's own work is done.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a direct call from the producer to its one consumer, or a simple work queue when there is exactly one consumer.
- Skip it when the caller needs an immediate answer, or when there is only one subscriber and no expectation of more.

## Costs and risks

- Harder to test and debug: interactions are asynchronous and the flow is not visible in the code.
- Delivery guarantees (at-most-once, at-least-once) and ordering must be designed; duplicates need idempotent subscribers.
- The broker is new infrastructure to run, and a possible single point of failure.
- Message schemas become contracts that are hard to change once many subscribers depend on them.

## What it means for the design

- A broker, as a component or a platform service, plus publishers and subscribers.
- Each topic and its message schema is a contract, owned by the publisher.
- The publisher owns the data in its events; each subscriber owns whatever it builds from them.

## What it leaves to component design

Broker technology and configuration, delivery and retry settings, idempotency handling, and serialization.

## Source

- Brian Oki, Manfred Pflügl, Alex Siegel and Dale Skeen, ["The Information Bus: An Architecture for Extensible Distributed Systems"](https://doi.org/10.1145/168619.168624), SOSP 1993.
- Kenneth Birman and Thomas Joseph, "Exploiting Virtual Synchrony in Distributed Systems", SOSP 1987, an earlier precursor.
