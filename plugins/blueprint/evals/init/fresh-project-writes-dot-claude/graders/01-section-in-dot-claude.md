---
type: regex
name: section-in-dot-claude
target:
  source: file
  path: .claude/CLAUDE.md
pattern: '<!-- blueprint:start -->[\s\S]*Planning with blueprint[\s\S]*<!-- blueprint:end -->'
weight: 1
---

.claude/CLAUDE.md holds the blueprint section between its start and end markers
