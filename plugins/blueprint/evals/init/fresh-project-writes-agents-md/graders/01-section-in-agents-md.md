---
type: regex
name: section-in-agents-md
target:
  source: file
  path: AGENTS.md
pattern: '<!-- blueprint:start -->[\s\S]*Planning with blueprint[\s\S]*<!-- blueprint:end -->'
weight: 1
---

AGENTS.md in the project root holds the blueprint section between its start and end markers
