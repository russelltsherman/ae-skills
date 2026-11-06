---
agent: claude
operator: A. Tester
skills: none
---
# Spec: Demo change

## Requirements
- R1. The lint reports nothing for this fixture.
- R2. Withdrawn: merged into R1. Was: The lint exits 0.
- R3. The lint's tests run it.

## Design
- `tests/lint.bats` lints the fixture (R1, R3).

## Out of scope / Deferred
None.

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. |
| C2 | Withdrawn. |

## Open questions from the intent
None.

## Areas of concern
None.
