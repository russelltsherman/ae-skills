---
name: pattern-client-server
description: Reference for the client-server architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing client-server or reviewing a design that uses it.
---

# Client-server

## What it is

Clients send requests to a server, which does the work and returns responses. The server holds the shared data and logic; clients present it and collect input. Many clients share one server (or one logical server made of several instances).

## Forces it answers

- **One source of truth** for data many users share.
- **Central control** of security, validation and updates: change the server once and every client sees it.
- **Thin clients** that run on limited devices.

## When it fits

- Many users or devices need the same data and must see each other's changes.
- Data must be protected from clients, or rules must be enforced in one place.
- Examples: web applications, email, banking, file sharing.

## When not to use it, and the simpler alternative

- **Simpler alternative:** a single local application with local storage, when only one user or device needs the data.
- Peer-to-peer fits better when there is no natural central authority and peers must keep working without one.
- Offline-first clients need sync and conflict handling that plain client-server does not give.

## Costs and risks

- The server is a single point of failure and a bottleneck unless it is replicated and scaled, which costs money and operational effort.
- Every interaction pays network latency; chatty protocols get slow.
- Clients and server must evolve their protocol compatibly, since old clients stay in the field.

## What it means for the design

- At least two components: the client(s) and the server.
- One contract between them: the request/response protocol or API, owned and versioned by the server.
- The server owns the shared data. Clients own at most local caches and preferences.

## What it leaves to component design

The protocol details and serialization, server internals, caching on either side, session handling, and how the server scales.

## Source

- Gregory R. Andrews, ["Paradigms for Process Interaction in Distributed Programs"](https://doi.org/10.1145/103162.103164), *ACM Computing Surveys* 23(1), 1991.
