---
name: standup
description: Writes my daily standup from yesterday's commits and today's open issues. Invoked only by the /standup command.
disable-model-invocation: true
---

# Standup

1. List my commits from the last working day with `git log --author="$(git config user.email)" --since=yesterday`.
2. List the issues assigned to me that are still open.
3. Reply with two short bullet lists, **Yesterday** and **Today**. Keep each bullet under 12 words.
