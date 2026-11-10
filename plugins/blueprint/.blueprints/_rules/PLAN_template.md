---
status: proposed
component: M<n>
---

<!-- Front matter: `status` is `proposed` until the work is done, then
     `completed`. `component` names the component in ARCHITECTURE.md that
     this directory designs.

     A plan covers one change and is not a living document. `lld` replaces a
     `completed` plan with the next one; it stops and asks the operator
     before replacing a `proposed` one. -->

# Plan: M<n> <name>

<!-- How to bring the code in line with SPEC.md and PROOFS.md: only the gap
     between them and the code as it is today. Read the code before
     writing; never plan against a guess of what exists. -->

## Files

<!-- Every file the work adds, edits or removes, and the requirements each
     change serves. Name real paths. Every row cites at least one
     requirement. -->

| File | Change | Requirements |
| --- | --- | --- |
| `<path>` | add / edit / remove: <what changes> | R<n>, R<n> |

## Order of work

<!-- Steps in the order they are done. Each step cites the requirements it
     completes, and ends with the code building and those requirements'
     proofs in PROOFS.md passing. The last step is always the one below. -->

1. <step>. (R<n>)
2. Close the change: write each lasting lesson where it belongs, then set
   this plan's `status` to `completed`. A lesson about how the component
   behaves or is built goes into SPEC.md, as a requirement or in the
   design; a lesson about how to verify a requirement goes into its proof
   in PROOFS.md; a lesson that crosses the boundary rule goes to the
   operator to take to `hld`.

## Risks

<!-- What could go wrong while doing the work, and what limits the damage. -->

- <risk>. Mitigated by <how>.
