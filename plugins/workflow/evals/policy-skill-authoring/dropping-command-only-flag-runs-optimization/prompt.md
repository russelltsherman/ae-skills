---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

I'd like the model to be able to start standup on its own, not just when I type /standup. Remove disable-model-invocation from it. Before you change anything, tell me which steps this change needs.

Input files: .claude-plugin/plugin.json, evals/standup/lists-yesterday-today/case.yaml, evals/standup/lists-yesterday-today/graders/01-two-lists.md, evals/standup/lists-yesterday-today/prompt.md, skills/standup/SKILL.md
