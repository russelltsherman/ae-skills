---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Add a new skill to this plugin called pr-description. It should write a pull request description from the current branch's commits: a one-line summary, a "Why" paragraph and a list of notable changes. The model should pick it up whenever someone asks for a PR description.

Input files: .claude-plugin/plugin.json, evals/release-notes/lists-merged-prs/case.yaml, evals/release-notes/lists-merged-prs/graders/01-one-bullet-per-pr.md, evals/release-notes/lists-merged-prs/prompt.md, skills/release-notes/SKILL.md
