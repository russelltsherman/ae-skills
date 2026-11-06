---
type: regex
name: handoff-file-unchanged
target:
  source: file
  path: .handoff
pattern: '^notes\n$'
weight: 1
---

The file .handoff still contains exactly notes and a newline
