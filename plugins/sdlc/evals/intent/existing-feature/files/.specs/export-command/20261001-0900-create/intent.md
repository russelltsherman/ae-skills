---
agent: claude
operator: Sam Ortiz
origin: person
type: feature
risk: routine
spec: required
---
# Intent: export tasks as CSV

## Problem
Tasks can only be read with `todo.py list`. There is no way to get them into a spreadsheet or another tool.

## Proposed outcome
`todo.py export` writes every task as CSV to standard output.

## Affected users and systems
- Users: the person who keeps the todo list.
- Systems: `todo.py`.

## Constraints
- C1. The CSV has a header row, `text,done`.
- C2. `todo.json` is read only; export never changes it.

## Open questions
None.

## Action already taken
None.
