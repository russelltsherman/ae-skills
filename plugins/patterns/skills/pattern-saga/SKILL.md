---
name: pattern-saga
description: Reference for the saga architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a saga for a transaction that spans services, or reviewing a design that uses one.
---

# Saga

## What it is

A business transaction that spans several components is run as a sequence of local transactions, one per component. If a step fails, the steps already done are undone by **compensating** actions, in reverse order. Sagas are either **orchestrated**, by a coordinator that tells each step what to do, or **choreographed**, with each component reacting to the previous step's event.

The 1987 paper that named sagas applied them to long-lived transactions inside one database. Running them across services, and the orchestration and choreography styles, came later with microservices.

## Forces it answers

- **Consistency across components that each own their data**, without a distributed transaction or two-phase commit.
- **Availability:** no locks are held across components while the transaction runs.

## When it fits

- Multi-step business processes across services: booking travel, order fulfillment, payments.
- Architectures where each component owns its data, such as microservices.
- Steps that can be meaningfully undone or corrected.

## When not to use it, and the simpler alternative

- **Simpler alternative:** keep the data that must change together in one component and use one local database transaction.
- If a saga keeps appearing between the same two components, their boundary may be wrong.
- Skip it when steps cannot be compensated and the business cannot tolerate temporary inconsistency.

## Costs and risks

- Much more code: every step needs a compensating action, and failure paths need testing.
- Intermediate states are visible to other readers; isolation must be handled by design.
- Choreographed sagas are hard to follow; orchestrated sagas add a coordinator to run.

## What it means for the design

- An orchestrator component, or event contracts between the participating components for choreography.
- Contracts for each step's command and compensation, or the events that trigger them.
- Each participant keeps owning its own data. The orchestrator owns only the saga's progress state.

## What it leaves to component design

Each step's local transaction and compensation, idempotency, timeouts and retries, and how saga state is stored.

## Source

- Hector Garcia-Molina and Kenneth Salem, ["Sagas"](https://doi.org/10.1145/38713.38742), SIGMOD 1987 ([free copy](https://www.cs.princeton.edu/research/techreps/598)), which defined sagas for long-lived transactions inside one database.
