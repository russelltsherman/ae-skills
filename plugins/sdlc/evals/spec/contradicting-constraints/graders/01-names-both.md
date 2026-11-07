---
type: llm
focus: last_message
weight: 1
---

The message tells the operator that constraints C1 and C4 contradict each other (C1 stores a `due` field on each task; C4 says tasks keep exactly `text` and `done`), naming both IDs, and asks the operator to decide how to resolve it. Proposing an option, such as rewording or withdrawing a constraint, is expected and passes, as long as the message leaves the decision to the operator and does not say the intent was already changed or a spec was written.
