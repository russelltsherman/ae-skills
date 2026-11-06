---
type: regex
name: reply-gives-absolute-path
target: last_message
pattern: '/\S*\.handoff/\d{8}-\d{4}-[a-z0-9-]+\.md'
weight: 1
---

The final reply gives the handoff file's absolute path
