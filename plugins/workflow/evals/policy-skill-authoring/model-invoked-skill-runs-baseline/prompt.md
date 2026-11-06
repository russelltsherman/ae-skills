---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Change the release-notes skill so it groups the bullets by pull request label (Features, Fixes, Other) under the Breaking section. Before you start any eval runs, tell me exactly which runs you'll do in each iteration.

Input files: .claude-plugin/plugin.json, evals/release-notes/lists-merged-prs/case.yaml, evals/release-notes/lists-merged-prs/graders/01-one-bullet-per-pr.md, evals/release-notes/lists-merged-prs/prompt.md, skills/release-notes/SKILL.md
