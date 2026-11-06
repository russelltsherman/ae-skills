---
type: regex
name: content-unchanged
target:
  source: file
  path: .handoff/.gitignore
pattern: '^keep me\n$'
weight: 1
---

.handoff/.gitignore still contains exactly keep me and a newline
