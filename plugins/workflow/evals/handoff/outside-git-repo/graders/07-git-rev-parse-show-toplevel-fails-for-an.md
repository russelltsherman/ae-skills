---
type: llm
focus: trace
weight: 1
---

`git rev-parse --show-toplevel` fails (for any reason, such as the directory not being a git repository or git being unavailable), and the handoff file is then written under `.handoff/` in the current working directory
