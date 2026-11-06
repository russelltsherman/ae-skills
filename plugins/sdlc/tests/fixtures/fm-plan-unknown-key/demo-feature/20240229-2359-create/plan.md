---
agent: claude
operator: A. Tester
skills: none
---
# Plan: Demo change

## Files that change
- tests/lint.bats

## Order of work
1. Lint the fixture (R1, R3).

## Risks
None.

## Proof
- `bats tests/lint.bats` passes (R1, R3).
