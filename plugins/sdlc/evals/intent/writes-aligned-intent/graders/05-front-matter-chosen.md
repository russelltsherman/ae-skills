---
type: tool_used
tool: Write
input_match: '"file_path":"[^"]*\.specs/[^"]*intent\.md","content":".*(?=.*\\ntype: (feature|fix|chore)\\n)(?=.*\\nrisk: (routine|elevated)\\n)(?=.*\\nspec: (required|skipped)\\n)'
min: 1
max: 1
arm: both
weight: 1
---
