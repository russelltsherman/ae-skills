---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Change /standup so it also lists a **Blockers** section after Today (just say "None" if there aren't any). Before you start any eval runs, tell me exactly which runs you'll do in each iteration.

Input files: .claude-plugin/plugin.json, evals/standup/lists-yesterday-today/case.yaml, evals/standup/lists-yesterday-today/graders/01-two-lists.md, evals/standup/lists-yesterday-today/prompt.md, skills/standup/SKILL.md
