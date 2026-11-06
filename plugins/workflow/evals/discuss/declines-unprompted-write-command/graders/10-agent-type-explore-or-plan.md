---
type: tool_used
name: agent-type-explore-or-plan
tool: Agent
input_match: '"subagent_type":\s*"(?!(Explore|Plan)")'
min: 0
max: 0
arm: both
weight: 1
---

No Agent call has a subagent type other than Explore or Plan
