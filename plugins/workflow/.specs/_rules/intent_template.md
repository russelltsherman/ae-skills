# Template: intent.md

An intent states what is wanted, why, and under which constraints, in the operator's own terms. An agent writes it, usually after an alignment session in which the operator answers its questions. It is the first document in a change directory and the input to `spec.md`, or to `plan.md` when the spec is skipped.

```
.specs/<feature>/<YYYYMMDD-HHMM>-<change>/intent.md
```

## Front matter

Flat `key: value` lines only, with no nesting and no YAML lists, so tooling can parse them without a YAML library. Use only the keys below.

| Key | Required | Values |
|---|---|---|
| `agent` | yes | The agent that wrote the intent, e.g. `claude`. For an intent an agent opened on its own, add its trigger, e.g. `monitoring agent (ci_test_failure_rate, 3 sigma)` |
| `operator` | yes | The person the agent aligned with. For an intent an agent opened on its own, `pending` until an operator aligns on it |
| `origin` | yes | `person`, `ticket`, `incident`, `scan` or `band` |
| `type` | yes | `feature`, `fix` or `chore` |
| `risk` | yes | `routine` or `elevated` |
| `spec` | yes | `required` or `skipped` |
| `links` | if `origin` is `ticket` | Comma-separated external references: ticket IDs or URLs. Related change directories are cited in `## Problem`, not here |

- **`origin`**: `person` is an operator's request; `ticket` comes from a tracker; `incident` from an outage or failure; `scan` from an automated scan (security, dependency, lint); `band` from a band breach, a monitored metric leaving its expected range (for example, a 3-sigma alert).
- **`type`**: `fix` when something that should already work does not; `feature` when the change adds or alters behavior; `chore` when behavior does not change (dependencies, refactoring, docs, tooling).
- **`risk`**: `elevated` when the change touches security, personal data, money, a public interface, or anything hard to reverse; otherwise `routine`. If unsure, choose `elevated`.
- **`spec`**: choose `skipped` only when `risk` is `routine`, the outcome and constraints are already precise enough to plan against, no open questions remain, and no policy skill has to be applied to resolve a design question. If unsure, choose `required`. The operator may change it before asking for the next document.
- **`operator`**: never create the next document while `operator` is `pending`. The operator who asks for it is the one who approves the intent.
- **No `status` or `approved_by` keys.** Approval is implied by the next document: the intent is approved once the operator asks for its `spec.md`, or its `plan.md` when the spec is skipped, and that document exists. Never create the next document unless the operator asks for it.

## Body

The first line after the front matter is `# Intent: <title>`. Use the same title in `spec.md` and `plan.md`.

Then these sections, in this order, with these exact headings. Write `None.` in a section that has nothing to say; never leave one out.

| Section | Contents |
|---|---|
| `## Problem` | What cannot be done today, who is affected, and the evidence. No solution. |
| `## Proposed outcome` | What better looks like, observable from outside the code. |
| `## Affected users and systems` | People, teams and systems touched. |
| `## Constraints` | One bullet per constraint: `- C1. <constraint>`. The spec shows how each one is met; when the spec is skipped, the plan does. |
| `## Open questions` | One bullet per question raised: `- Q1. <question>`. When the operator answers one, move the answer into the section it changes (usually `## Constraints`, as a new constraint) and delete the question. When none remain, write `None.` The spec answers each remaining one or carries it forward as a concern. |
| `## Action already taken` | What an agent did before any operator was involved (for example, a runbook it ran), with timestamps. Has content when `origin` is `incident`, `scan` or `band`; otherwise `None.` |

## Rules

- Record the problem, outcome and constraints in the operator's terms, as given in the alignment session. Do not reframe them, and do not design the solution; that is the spec's job.
- Resolve a question only with an answer the operator gave. An answer the agent proposes stays an open question.
- Name each constraint so it can be checked. Write "No new personal data stored", not "Keep it secure".
- **Constraint IDs are permanent.** Number them `C1`, `C2` and so on in order. Never renumber or reuse an ID. To drop a constraint, write `- C2. Withdrawn: <reason>. Was: <original text>.` The spec and plan cite these IDs.
- **Open question IDs are stable while questions remain.** Number them `Q1`, `Q2` and so on in order; a new question takes the next number after the highest one in the list. Never renumber. A question that is answered or dropped is deleted, and the gap it leaves is expected. Once none remain, numbering starts again at `Q1`. The spec cites these IDs.
- An intent whose `origin` is `incident`, `scan` or `band` cites its evidence in `## Problem`.
- Cite any earlier change this one relates to in `## Problem` as `<feature>/<YYYYMMDD-HHMM>-<change>`, with requirement IDs where relevant (for example, `hold-notify-service/20261102-0915-create R2`).
- Until the intent is committed, it can be reworked as needed, whether or not later documents exist; carry every change forward into the spec and plan in the same edit. Once committed, change the intent only in a commit that says why. The same commit updates every later document in the change directory that cites what changed, or its message says that none is affected; a withdrawn constraint is marked `Withdrawn.` in the spec's `## How each constraint is met` and, when the spec is skipped, comes out of the plan.

## Example

```markdown
---
agent: claude
operator: M. Okafor
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: notify patrons when a held book is ready

## Problem
Patrons find out a held book is ready only by checking the catalogue.
About a fifth of held books expire on the shelf unclaimed.

## Proposed outcome
Patrons are told when a held book is ready and how long it will be kept for them.

## Affected users and systems
Patrons, branch staff, the holds service, the patron accounts service.

## Constraints
- C1. Use only contact details the patron has already given us.
- C2. Patrons can turn notifications off.
- C3. Notifications can be sent by email or SMS.

## Open questions
- Q1. Should patrons also be reminded the day before a hold expires?

## Action already taken
None.
```
