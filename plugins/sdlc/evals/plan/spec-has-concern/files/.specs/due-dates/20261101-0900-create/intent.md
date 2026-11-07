---
agent: claude
operator: Dana Reyes
origin: person
type: feature
risk: routine
spec: required
---
# Intent: give tasks due dates

## Problem
Tasks have no due dates, so `list` cannot show what is due soon or what is already late.

## Proposed outcome
A task can be given a due date when it is added, and `list` shows each task's due date and marks the overdue ones.

## Affected users and systems
- Users: the one person who uses this todo list.
- Systems: `todo.py`, `todo.json`, the Usage section of `README.md`, and the tests in `tests/`.

## Constraints
- C1. A task can be added with one optional due date, written YYYY-MM-DD.
- C2. `list` shows each task's due date, and marks a task that is not done and whose due date is before today as overdue.
- C3. A `todo.json` written before due dates existed keeps working.
- C4. An invalid date is refused and nothing is saved.

## Open questions
None.

## Action already taken
None.
