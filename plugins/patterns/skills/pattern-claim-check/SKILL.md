---
name: pattern-claim-check
description: Reference for the claim check pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when messages carry large payloads, or reviewing a messaging design that moves large data.
---

# Claim check

## What it is

Instead of sending a large payload through the message broker, the sender stores the payload in external storage and sends a small message carrying a **claim check**: a reference to the stored payload. The receiver uses the reference to fetch the payload when it needs it.

## Forces it answers

- **Broker limits and cost:** keeps messages small and fast.
- **Security:** the payload can be protected separately from the message.

## When it fits

- Messages that carry files, images or large documents.
- Brokers with message size limits.

## When not to use it, and the simpler alternative

- **Simpler alternative:** send the payload in the message, when payloads are small enough for the broker.
- Skip it when every consumer needs the whole payload immediately and storage access adds more latency than it saves.

## Costs and risks

- Two systems to keep consistent: the payload may be missing or deleted when the message arrives.
- Storage lifecycle and cleanup to manage.

## What it means for the design

- Shared storage as infrastructure next to the broker.
- The message contract carries a reference rather than the data.
- The sender owns the stored payload and its lifetime.

## What it leaves to component design

Storage choice, reference format, access control and expiry.

## Source

- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns*, Addison-Wesley, 2003, ["Claim Check"](https://www.enterpriseintegrationpatterns.com/patterns/messaging/StoreInLibrary.html).
