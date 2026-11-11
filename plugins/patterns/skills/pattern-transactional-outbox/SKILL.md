---
name: pattern-transactional-outbox
description: Reference for the transactional outbox pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when a component must update its data and publish an event or message reliably, or when reviewing a design that publishes events from a database-backed component.
---

# Transactional outbox

## What it is

A component that changes its data and must also publish a message writes the message to an **outbox** table in the same local database transaction as the data change. A separate relay, polling the table or tailing the database log (change data capture), then publishes the outbox messages to the broker and marks them sent. The data change and the message either both happen or neither does.

## Forces it answers

- **No lost or phantom events:** avoids the dual-write problem of updating a database and a broker separately.
- **Reliability without distributed transactions.**

## When it fits

- Event-driven designs, sagas and pub-sub, wherever a component publishes events about its own data changes.
- Any database-backed component that integrates with a message broker.

## When not to use it, and the simpler alternative

- **Simpler alternative:** publish after commit and accept rare lost events, when a lost event is harmless or is caught by periodic reconciliation.
- Event sourcing makes it unnecessary: the event log is the store.

## Costs and risks

- A relay process to run and monitor.
- At-least-once delivery: consumers must tolerate duplicates.
- Publishing latency and outbox growth need watching.

## What it means for the design

- The relay may be part of the owning component or a shared platform service.
- No new contract: the events published are the existing event contracts.
- The outbox table is owned by the component whose data changes.

## What it leaves to component design

Outbox schema, polling or log-tailing, ordering, cleanup, and idempotent consumers.

## Source

- Chris Richardson, *Microservices Patterns*, Manning, 2018.
- Chris Richardson, ["Pattern: Transactional outbox"](https://microservices.io/patterns/data/transactional-outbox.html), microservices.io.
