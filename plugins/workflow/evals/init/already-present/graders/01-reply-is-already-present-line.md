---
type: regex
name: reply-is-already-present-line
target: last_message
pattern: '^Already present, left unchanged: /\S+/\.handoff/\.gitignore\.\s*$'
weight: 1
---

The final reply is exactly one line: Already present, left unchanged: <absolute path ending in /.handoff/.gitignore>.
