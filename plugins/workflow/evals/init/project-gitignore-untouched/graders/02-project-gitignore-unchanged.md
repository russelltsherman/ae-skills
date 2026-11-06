---
type: regex
name: project-gitignore-unchanged
target:
  source: file
  path: .gitignore
pattern: '^node_modules/\n$'
weight: 1
---

The project .gitignore still contains exactly node_modules/ and a newline
