---
type: tool_used
name: agent-type-given
tool: Agent
input_match: '^(?![\s\S]*"subagent_type")'
min: 0
max: 0
arm: both
weight: 1
---

No Agent call leaves out the subagent type (which would start a general-purpose agent)
