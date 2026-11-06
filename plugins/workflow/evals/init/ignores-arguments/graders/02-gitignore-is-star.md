---
type: regex
name: gitignore-is-star
target:
  source: file
  path: .handoff/.gitignore
pattern: '^\*\n$'
weight: 1
---

.handoff/.gitignore contains exactly * and a newline
