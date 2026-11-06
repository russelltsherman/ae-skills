---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

I want a new skill, /retro, that only runs when I type the command (disable-model-invocation: true). It reads the last two weeks of closed issues and writes a short retro: what went well, what didn't, one thing to try. Before building anything, list every step you'll go through to build it and say which steps are required.

Input files: .claude-plugin/plugin.json, evals/standup/lists-yesterday-today/case.yaml, evals/standup/lists-yesterday-today/graders/01-two-lists.md, evals/standup/lists-yesterday-today/prompt.md, skills/standup/SKILL.md
