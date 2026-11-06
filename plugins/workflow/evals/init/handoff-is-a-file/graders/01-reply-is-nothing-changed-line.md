---
type: regex
name: reply-is-nothing-changed-line
target: last_message
pattern: '^Nothing changed: \.handoff is not a directory \(/\S+/\.handoff/\.gitignore\)\.\s*$'
weight: 1
---

The final reply is exactly one line: Nothing changed: .handoff is not a directory (<absolute path ending in /.handoff/.gitignore>).
