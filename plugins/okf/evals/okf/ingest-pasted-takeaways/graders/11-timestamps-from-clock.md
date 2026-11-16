---
type: llm
focus: trace
weight: 1
---

Every frontmatter timestamp the run wrote or changed, and every `## YYYY-MM-DD` heading it added to log.md, is the real time of the run, read from the clock: no earlier than the run started and no later than it finished (UTC; a guessed value such as T00:00:00Z or a future time fails). Pages the run did not change keep their original timestamps.
