---
agent: claude
operator: Dana Reyes
origin: person
type: feature
risk: routine
spec: required
---
# Intent: clear finished tasks

## Problem
Finished tasks stay in `todo.json` forever, so `list` gets longer every week and the open tasks are hard to find among the done ones.

## Proposed outcome
A `clear` command removes the finished tasks and says how many it removed.

## Affected users and systems
- Users: the one person who uses this todo list.
- Systems: `todo.py`, `todo.json` and the Usage section of `README.md`.

## Constraints
- C1. `python3 todo.py clear` removes from `todo.json` every task whose `done` is `true`, and keeps every other task in its existing order.
- C2. After clearing, it prints exactly one line, `removed N`, where N is the number of tasks removed.
- C3. When `todo.json` does not exist, or no task is done, it prints `removed 0` and does not create or rewrite `todo.json`.
- C4. The usage line printed by `todo.py` with no arguments, and the Usage section of `README.md`, both list `clear`.

## Open questions
None.

## Action already taken
None.
