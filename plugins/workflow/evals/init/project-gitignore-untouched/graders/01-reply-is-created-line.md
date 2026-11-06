---
type: regex
name: reply-is-created-line
target: last_message
pattern: '^Created /\S+/\.handoff/\.gitignore\.\s*$'
weight: 1
---

The final reply is exactly one line: Created <absolute path ending in /.handoff/.gitignore>.
