---
type: regex
name: names-handoff-once
target: last_message
pattern: '/handoff'
match: 'count:1'
weight: 1
---

The final reply names /handoff exactly once
