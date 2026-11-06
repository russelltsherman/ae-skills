---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Add two test cases for the release-notes skill: one where there are no merged pull requests since the last tag, and one where a pull request is labelled breaking. Just the test cases for now, don't change the skill itself.

Input files: .claude-plugin/plugin.json, evals/release-notes/lists-merged-prs/case.yaml, evals/release-notes/lists-merged-prs/graders/01-one-bullet-per-pr.md, evals/release-notes/lists-merged-prs/prompt.md, skills/release-notes/SKILL.md
