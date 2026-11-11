---
name: pattern-cqrs
description: Reference for the CQRS (command query responsibility segregation) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing CQRS or reviewing a design that uses it.
---

# CQRS (command query responsibility segregation)

## What it is

Writes (commands) and reads (queries) go through separate models. The write model validates commands and records changes; one or more read models hold data shaped for the queries that need it, and are updated from the write side, usually asynchronously. The two sides may share a database or use different stores.

## Forces it answers

- **Read performance and scale** when reads far outnumber writes, or when queries need shapes the write model cannot serve efficiently.
- **Independent scaling** of the read and write sides.
- **Simpler write logic**, free of query concerns, in domains with complex rules.

## When it fits

- Read-heavy workloads with several very different query shapes.
- Complex domains where the write model's rules would be distorted by reporting needs.
- Often paired with event sourcing, where read models are projections of the event log.

## When not to use it, and the simpler alternative

- **Simpler alternative:** one model and one database, with indexes, views or a read replica for heavy queries.
- Skip it for simple create-read-update-delete applications, and wherever users must always see their own write immediately and the team cannot afford the work to guarantee that.

## Costs and risks

- Read models are eventually consistent: a query can miss a write that just succeeded.
- More moving parts: projection code, extra stores, rebuild procedures for read models.
- More database technologies can mean more cost and more operational skill needed.

## What it means for the design

- Separate write and read paths, often separate components for command handling and for each read model.
- A contract carrying changes from the write side to the read side, such as events or change data capture.
- The write side owns the authoritative data. Read models own only derived copies and can be rebuilt.

## What it leaves to component design

Projection logic, read store choice and schema, how lag is measured and handled, and how read models are rebuilt.

## Source

- Greg Young, "CQRS, Task Based UIs, Event Sourcing agh!", CodeBetter blog, 2010 (original URL no longer online).
- Greg Young, ["CQRS Documents"](https://cqrs.wordpress.com/wp-content/uploads/2010/11/cqrs_documents.pdf), 2010.
