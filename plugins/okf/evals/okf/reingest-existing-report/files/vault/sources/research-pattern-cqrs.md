---
type: Article
title: "Research: CQRS for web applications"
description: Cited /ae-research report on CQRS — separate models not databases, bounded-context scope, eventual-consistency costs, and Netflix Tudum.
resource: /home/user/src/ae-research/research/cqrs-command-query-responsibility-segregation-for-web-applic.md
tags: [research, architecture, web, cqrs]
timestamp: 2026-11-15T00:00:00Z
---

# Summary
CQRS splits one conceptual model into a command (write) model and a query (read) model. It is about
models, not database topology. Apply it only in bounded contexts with a clear benefit; most should
stay CRUD. Once stores split, reads are eventually consistent. [[org-netflix]] kept CQRS on Tudum but
replaced the read path with RAW Hollow, cutting page builds from ~1.4 s to ~0.4 s.

Distilled as [[pattern-cqrs]].

# Citations
[1] [CQRS (Martin Fowler, bliki)](https://www.martinfowler.com/bliki/CQRS.html)
[2] [CQRS pattern (Azure Architecture Center)](https://learn.microsoft.com/azure/architecture/patterns/cqrs)
[3] [How Netflix Tudum supports 20 million users (ByteByteGo, 2025)](https://blog.bytebytego.com/p/how-netflix-tudum-supports-20-million)
