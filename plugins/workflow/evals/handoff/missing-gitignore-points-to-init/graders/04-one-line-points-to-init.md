---
type: regex
name: one-line-points-to-init
target: last_message
pattern: '^[^\n]*/workflow:init[^\n]*\s*$'
weight: 1
---

The final reply is one line that tells the user to run /workflow:init
