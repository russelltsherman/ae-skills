---
type: regex
name: handoff-gitignore-unchanged
target:
  source: file
  path: .handoff/.gitignore
pattern: '^\*\.md\n$'
weight: 1
---

.handoff/.gitignore still contains exactly *.md and a newline
