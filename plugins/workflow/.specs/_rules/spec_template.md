# Template: spec.md

A spec turns an approved `intent.md` into numbered requirements and a design that can be planned against, with areas of concern flagged for the operator to decide. An agent writes it, usually after an alignment session with the operator. It sits beside the intent it answers.

```
.specs/<feature>/<YYYYMMDD-HHMM>-<change>/spec.md
```

Write a `spec.md` only when a corresponding `intent.md` exists, its `operator` is not `pending`, and the operator asks for the spec. Asking for it approves the intent.

## Front matter

Flat `key: value` lines only, as in `intent.md`. Use only the keys below.

| Key | Required | Values |
|---|---|---|
| `agent` | yes | The agent that wrote the spec, e.g. `claude` |
| `operator` | yes | The person the agent aligned with |
| `skills` | yes | Comma-separated names of the policy skills applied, or `none`. Their versions are the ones in the repo at the commit that adds this spec. |

No `status` or `approved_by` keys. The spec is approved once the operator asks for its `plan.md` and that plan exists. Never create the plan unless the operator asks for it.

## Body

The first line after the front matter is `# Spec: <title>`, using the same title as the intent.

Then these sections, in this order, with these exact headings. Write `None.` in a section that has nothing to say; never leave one out.

| Section | Contents |
|---|---|
| `## Requirements` | One bullet per requirement: `- R1. <requirement>`. Each one is testable. |
| `## Design` | How the requirements are met: components, interfaces and data flow. Cite requirement IDs. |
| `## Out of scope / Deferred` | One bullet per thing this change deliberately does not do, and why: `- <item>. <reason>.` Say `Deferred` when it is meant for a later change. |
| `## How each constraint is met` | A table with columns `Constraint` and `Met by`. One row for every constraint ID in the intent, including withdrawn ones (`Withdrawn.`), each citing a requirement or design point. |
| `## Open questions from the intent` | One bullet for every open question ID still in the intent: answered here, or `- Q1. Carried forward as concern K1.` When that concern is decided, the bullet cites where the decision landed instead, e.g. `- Q1. Answered by R5.` `None.` when the intent has none. |
| `## Areas of concern` | One bullet per concern the operator must decide: `- K1. <concern>. Proposed: <option>.` When the operator decides one, move the decision into the section it changes and delete the concern (see "Settling a concern"). When none remain, write `None.` |

## Rules

- **Requirement IDs are permanent.** Number them `R1`, `R2` and so on in order. Never renumber or reuse an ID. To drop a requirement, write `- R3. Withdrawn: <reason>. Was: <original text>.` Plans, reviews, evals and later changes cite these IDs, from other change directories as `<feature>/<YYYYMMDD-HHMM>-<change> R3`.
- **Flag conflicts; don't resolve them silently.** When two policy skills, or a skill and the intent, cannot both be satisfied, say so in `## Areas of concern`, propose an option, and leave the decision to the operator.
- **Decisions come only from the operator.** Never settle a concern the operator did not decide. A proposed option is not a decision.
- **Settling a concern.** Write the operator's decision where it belongs: a new or changed requirement, a design point, or an `## Out of scope / Deferred` bullet. End that line with `(operator decision, <YYYY-MM-DD>)` so the operator's authorship stays visible. Then delete the concern. A concern settled during alignment is never listed; its decision goes straight to where it belongs, with the same marker.
- **Concern IDs are stable while concerns remain.** Number them `K1`, `K2` and so on in order; a new concern takes the next number after the highest one in the list. Never renumber. A settled concern is deleted, and the gap it leaves is expected. Once none remain, numbering starts again at `K1`.
- **Every intent constraint ID and open question ID appears exactly once** in its section.
- **No concerns remain before the plan.** Do not write `plan.md` while `## Areas of concern` lists any concern. Ask the operator to decide it first.
- Until the spec is committed, it can be reworked as needed, whether or not `plan.md` exists; keep the plan in step with it. Once committed, change the spec only in a commit that says why. Such changes count as requirements rework. The same commit updates the plan to match; a withdrawn requirement comes out of the plan's `## Order of work` and `## Proof`.

## Example

```markdown
---
agent: claude
operator: M. Okafor
skills: policy-security, policy-ux, policy-brand
---
# Spec: notify patrons when a held book is ready

## Requirements
- R1. When a hold becomes ready, the patron is notified within 15 minutes.
- R2. The notification gives the title, the branch and the date the book is kept until, worded "Kept for you until <date>" (operator decision, 2026-11-02).
- R3. The patron's chosen channel is used: email, SMS or none.
- R4. A patron can change the channel, including turning it off, from their account page.

## Design
- The holds service publishes a hold-ready event (R1).
- A new notifier reads the event and the patron's channel from patron accounts and sends the message (R2, R3).
- The account page gets a notification setting, stored in patron accounts (R4).

## Out of scope / Deferred
- Deferred: a reminder the day before a hold expires. It doubles SMS volume and cost; revisit after a month of send volumes (operator decision, 2026-11-02).

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R3. The notifier reads existing contact fields and stores none. |
| C2 | R3, R4. `none` is a channel choice. |
| C3 | R3. Email and SMS are channel choices. |

## Open questions from the intent
- Q1. Answered under Out of scope / Deferred.

## Areas of concern
- K3. The policy-security skill requires SMS sends to go through the approved gateway, which batches every 30 minutes and breaks R1's 15 minutes. Proposed: send SMS within 30 minutes and keep R1 for email.
```
