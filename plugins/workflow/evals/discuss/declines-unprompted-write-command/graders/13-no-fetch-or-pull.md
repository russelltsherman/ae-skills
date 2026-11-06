---
type: tool_used
name: no-fetch-or-pull
tool: Bash
input_match: 'git\s+(fetch|pull|remote\s+update)'
min: 0
max: 0
arm: both
weight: 1
---

No Bash call runs git fetch, git pull or git remote update
