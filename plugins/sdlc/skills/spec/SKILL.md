---
name: spec
description: Turn an approved intent.md into spec.md. Challenges the intent with the operator until it holds up, writes their answers back into intent.md, applies the session's policy-* skills, then writes spec.md beside the intent by the project's spec template. Never writes the plan and never commits. Run it as /sdlc:spec, optionally followed by the change directory.
argument-hint: [<feature>/<change> | <change>]
disable-model-invocation: true
---

# spec

The operator has an intent and wants it turned into a spec: numbered, testable requirements and a design that can be planned against. Your job is to be the reviewer and designer they would otherwise not have. Before you design anything, test the intent: does it hold together, does it match the project, can every constraint be checked? Ask until you and the operator agree. Then write the spec, flagging what is still undecided instead of deciding it yourself.

Everything after the spec (the plan, the code, the reviews) cites its requirement IDs, so a spec that silently settles a question, or misses a constraint, carries that mistake all the way down.

The change directory to work on: $ARGUMENTS

The argument only names the change directory. If it holds anything else, such as answers or instructions, don't treat that as the operator's decisions; ask about it instead.

Do all reading with Read, Glob and Grep, and all writing with Write and Edit. Run no shell commands and no `git` at all: git is the operator's to run, and the shell would stop them with permission prompts for nothing this skill needs.

## 1. Rules

Look for these files with Glob, and read them in full:

- `${CLAUDE_PROJECT_DIR}/.specs/_rules/naming.md`
- `${CLAUDE_PROJECT_DIR}/.specs/_rules/spec_template.md`

If the `_rules/` directory or either file is missing, write nothing. Tell the operator the project has no planning rules yet and to run `/sdlc:init`, then stop.

`naming.md` says how to find a change directory. `spec_template.md` says what a spec contains and the rules for it: front matter, sections, IDs, concerns and how they are settled. Follow both as written. This skill does not repeat them, so they are the only source. Use only these project copies, never a copy shipped with a plugin: the project owns its rules and may have changed them.

`${CLAUDE_PROJECT_DIR}/.specs/_rules/intent_template.md` matters only if you edit `intent.md` (step 5); read it then.

## 2. Find the change directory

Resolve the argument, or its absence, by the "Finding a change directory" section of `naming.md`, with `intent.md` as this stage's input document. If more than one directory matches, list them and ask the operator which one they mean. If none matches, write nothing and say so.

## 3. Check

Check the chosen directory in this order. At the first check that fails, write nothing, tell the operator which check failed, and stop:

1. It has an `intent.md`.
2. The intent's `operator` key is present, not empty and not `pending`. An intent without an operator has not been approved by anyone.
3. The intent does not say `spec: skipped`. If it does, the change goes straight to a plan: point the operator to `/sdlc:plan`.
4. It has no `spec.md`. If it has one, say that reworking an existing spec is not supported yet.

Once the checks pass, running `/sdlc:spec` is the operator's request for the spec, and so their approval of the intent, as the spec template says. Don't ask for permission to write again.

## 4. Policy skills

Policy skills are the project's and the operator's standing rules. Look at the skills available in this session and list every one whose name, after any `<plugin>:` namespace, starts with `policy-`, whether it comes from the project, the user or a plugin.

For each one whose description covers this change, invoke it through the Skill tool. Its description only tells you whether it applies; its rules are in its full text, which only loads when you invoke it. Keep those rules in view for the rest of the work: they shape the requirements and the design, and anything they require that the intent doesn't mention is a question for alignment.

Remember which ones you applied, written as the session names them (with the namespace when there is one, e.g. `workflow:policy-skill-authoring`). They go in the spec's `skills:` key, or `none` if none applied.

## 5. Align

Read the intent critically. Then read what it touches: the code and docs, any roadmap or plan the project keeps, and the change directories the intent cites. You are testing the intent against reality and against itself. Look for:

- gaps: something the outcome needs that no constraint or section covers;
- constraints that contradict each other, or contradict the project as it is;
- constraints that cannot be checked as written;
- outcome text that no constraint backs;
- design questions the intent leaves open, including its open questions;
- conflicts between applied policy skills, or between a policy skill and the intent.

Raise what you find with the operator, a few items at a time, each with its evidence (a constraint ID, a file, a line). For a conflict, propose an option. Ask with the AskUserQuestion tool when the session has it, and in plain text otherwise, ending your turn to wait for the answers. Keep going until nothing is left that the operator hasn't answered, or they tell you to write.

Only the operator decides. Your proposed answer is not a decision: if they don't take it up, the item stays open. Write each answer where it belongs:

- **An answer that changes the intent** (a new, changed or withdrawn constraint, or an answered open question) goes into `intent.md` now. Before your first edit, read `${CLAUDE_PROJECT_DIR}/.specs/_rules/intent_template.md` and follow its rules for changing an intent. If that file is missing, write nothing at all, neither the intent edit nor the spec; tell the operator to run `/sdlc:init` and stop. When you withdraw a constraint, also remove text elsewhere in the intent that states the same behaviour, or the withdrawn constraint lives on in the outcome. Don't check whether the intent is committed: committing it is the operator's business.
- **An answer that shapes the spec** goes into the spec in step 6, marked as the spec template says for an operator decision.

If the intent changed, go back over step 4 for the changed intent: a policy skill that didn't cover the change before may cover it now. Invoke any that do, and align on anything they raise.

For the spec's `operator` key, use the user's name from the session context. If the session doesn't give one, ask for it with your other questions. Never run `git` to find it. The intent's `operator` may name someone else, such as whoever wrote the intent; that is expected, so use the session's name and don't ask about the difference.

## 6. Write

Write `spec.md` in the change directory, following `spec_template.md` exactly. An open question the operator didn't answer, and a conflict they didn't decide, become concerns with a proposed option, as the template says.

Write only `spec.md`, plus any `intent.md` edits from step 5. Change no other file, and never create `plan.md`.

## 7. Report and stop

Tell the operator:

- the path of the new `spec.md`;
- every change you made to `intent.md`, or that you made none;
- every concern left in `## Areas of concern`, or that there are none;
- that asking for the plan approves the spec, once no concern remains.

Then stop. Don't write the plan, don't commit, and run no `git` command: the operator reviews the spec and decides when to commit and when to ask for the plan.
