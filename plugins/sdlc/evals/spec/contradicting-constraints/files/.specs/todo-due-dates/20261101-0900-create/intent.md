---
agent: claude
operator: Dana Reyes
origin: person
type: feature
risk: routine
spec: required
---
# Intent: give tasks a due date

## Problem
Tasks have no due date, so `list` cannot show what is due soon.

## Proposed outcome
A task can have one optional due date, set when it is added, and `list` shows it.

## Affected users and systems
- Users: the one person who uses this todo list.
- Systems: `todo.py` and `todo.json`.

## Constraints
- C1. Each task's due date is stored in `todo.json` as a `due` field on the task, in `YYYY-MM-DD` form.
- C2. `python3 todo.py add "<text>" --due YYYY-MM-DD` sets the due date; `add` without `--due` works as it does now.
- C3. `list` shows a task's due date after its text.
- C4. The format of `todo.json` does not change: each task keeps exactly the fields `text` and `done` and no others, so older copies of `todo.py` can still read it.

## Open questions
None.

## Action already taken
None.
