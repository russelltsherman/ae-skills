---
agent: claude
operator: Dana Reyes
skills: none
---
# Spec: give tasks due dates

## Requirements
- R1. `python3 todo.py add <text> --due YYYY-MM-DD` adds the task with that due date, stored as a `due` field on the task in `todo.json`. Without `--due`, the task has no `due` field.
- R2. `python3 todo.py list` prints a task's due date after its text, as ` (due YYYY-MM-DD)`, and ends the line with ` OVERDUE` when the task is not done and its due date is before today's local date.
- R3. A `todo.json` whose tasks have no `due` field loads, lists and saves as it did before this change.
- R4. When `--due` is not a valid YYYY-MM-DD date, `add` prints `invalid date: <value>`, exits with status 2 and leaves `todo.json` unchanged.
- R5. The Usage section of `README.md` shows `add` with `--due`.

## Design
- **Parsing** (R1, R4). `add` takes `--due` and parses it with `parse_day()` from the project's existing `dates.py` module, which already turns YYYY-MM-DD strings into dates.
- **Listing** (R2, R3). `list` reads `due` with `.get`, so tasks without it print as before.
- **Tests** (R1 to R4). A new `tests/test_due.py`, in the style of `tests/test_todo.py`.

## Out of scope / Deferred
- Changing or removing a task's due date after it is added. Deferred.
- Sorting `list` by due date.

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1, R5. |
| C2 | R2. |
| C3 | R3. |
| C4 | R4. |

## Open questions from the intent
None.

## Areas of concern
None.
