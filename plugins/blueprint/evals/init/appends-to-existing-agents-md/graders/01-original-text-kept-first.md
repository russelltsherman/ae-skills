---
type: regex
name: original-text-kept-first
target:
  source: file
  path: AGENTS.md
pattern: '^# Inventory service\n\nRun `make test` before every commit\.\nIndent with tabs\.\n'
weight: 1
---

AGENTS.md still begins with its original four lines, unchanged
