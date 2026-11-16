---
tags: [okf, ingest]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

save these takeaways from today's architecture review to my knowledge base:

- we're keeping the billing service inside the monolith for now; splitting it out would break the atomic invoice+ledger write
- the team measured p95 checkout latency at 180ms on the monolith vs 410ms on the old split prototype, but that was one load test on staging so don't treat it as settled
- open question: do we need a separate read model for the reporting dashboard, or are postgres materialized views enough? nobody knew
- Priya thinks module boundaries should be enforced in CI with an architecture test; Tom disagrees and thinks code review is enough

Input files: vault/
