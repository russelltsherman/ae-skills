---
name: plan
description: Turn a ready spec.md, or an intent.md that says spec skipped, into plan.md. Reads the intent, spec and code, questions the operator until the change is understood, checks every Proof command against the real tool, then writes or reworks plan.md by the project's plan template. Never edits code, never starts implementation and never commits. Run it as /sdlc:plan, optionally followed by the change directory.
argument-hint: "[<feature>/<change> | <change>]"
disable-model-invocation: true
---

# plan

The operator has a change that is ready to plan: a spec with no open concerns, or an intent that skips the spec. Your job is to be the engineer who reads it all before anyone touches the code: test the spec against the code as it really is, find what it missed, ask the operator what you cannot settle yourself, and only then write a plan that someone who never saw this session could implement from alone.

The plan is what implementation follows and what review checks the diff against. A step that rests on a guess, a file the plan forgot, or a Proof command that cannot run will all surface later as broken work, so this is the last cheap place to catch them.

The operator's input: $ARGUMENTS

The first word of that input may name the change directory (`<feature>/<change>` or `<change>`). If it does, everything after it is the operator's own message: answers to questions you would ask, decisions, or the go-ahead to write. Treat it as their words, just as if they had typed it in reply to you. If the first word names no change directory, treat the whole input as their message and find the directory as if no argument was given.

## What you may do

- **Read** with Read, Glob and Grep, and use read-only subagents (such as Explore) for wide searches.
- **Run read-only commands only**: the checks in step 7, and these four `git` commands: `git status`, `git diff`, `git log` and `git show`. No other `git` subcommand, even a read-only one such as `ls-files`: list and read files with Glob, Grep and Read instead. Never run `make`, and never run anything that makes model calls, starts a billed run or changes a file. If `git` fails, go on from the files alone.
- **Write** only `plan.md`, `spec.md` and `intent.md`, and only in the change directory you found, with the Write and Edit tools.
- **Never** edit code, never start implementation, never commit, and never call `EnterPlanMode` or `ExitPlanMode` or write to built-in plan mode's plan file. Accepting a plan in built-in plan mode starts implementation, and the project's rules forbid that until the operator asks for it.

## 1. Check the project's rules

Look for these files with Glob:

- `${CLAUDE_PROJECT_DIR}/.specs/_rules/naming.md`
- `${CLAUDE_PROJECT_DIR}/.specs/_rules/intent_template.md`
- `${CLAUDE_PROJECT_DIR}/.specs/_rules/spec_template.md`
- `${CLAUDE_PROJECT_DIR}/.specs/_rules/plan_template.md`

If any is missing, write nothing and ask nothing about the change. Tell the operator the project has no planning rules yet and to run `/sdlc:init` first, then stop.

Use only these project copies, never a copy shipped with a plugin: the project owns its rules and may have changed them. This skill does not repeat them, so they are the only source for how change directories are found and what each document contains and how it may change. Read `naming.md` and `plan_template.md` now, in full. Read `spec_template.md` and `intent_template.md` in full before you edit the document each one governs.

## 2. Note whether you are in plan mode

If the session's system messages say plan mode is active, remember it. You may still read and align, but you must not write anything until the operator has left plan mode (step 8). Don't call `ExitPlanMode` yourself: that is the operator's way of approving implementation, not this skill's.

## 3. Find the change directory

Resolve the argument, or its absence, as the "Finding a change directory" section of `naming.md` says, with this stage's input document. If more than one directory matches, list them and ask the operator which one they mean, writing nothing. If none matches, write nothing and say so.

Read `intent.md`, `spec.md` (if there is one) and `plan.md` (if there is one) in that directory.

## 4. Check the gate

`plan_template.md` says when a plan may be written. Check it, and stop with nothing written, saying why, when:

- the intent's `operator` key is missing, empty or `pending`: nobody has approved the intent;
- the intent says `spec: required` and there is no `spec.md`: point the operator to `/sdlc:spec`.

If the spec lists concerns in `## Areas of concern`, or an intent with `spec: skipped` lists open questions, those come first. Name each one, with the option the document proposes, and ask the operator to decide it. Record each decision as step 6 says. Write no plan while any remain, even if the operator tells you to write: a plan built on an undecided concern bakes a guess into the work.

Running `/sdlc:plan` is the operator's request for the plan, and so their approval of the spec (or of the intent, when the spec is skipped), as the template says. Don't ask for permission to write again.

## 5. Read the code

Read the code and docs the change touches: every file the spec names, the files around them, the tests, the build and test tooling the project uses, and anything the spec relies on existing. Use `git status`, `git log` and `git diff` to see what changed recently and, when reworking a plan, what implementation has done so far.

## 6. Align

Think critically before you plan. Test the spec against the code:

- requirements the code makes hard, or that nothing could prove;
- files the change must touch that the spec does not mention;
- places where the spec and the code disagree: a module, command, function or file the spec names that does not exist, or works differently from what the spec assumes;
- what the change could break, which step is riskiest, and which options you are choosing not to take.

Say back, briefly, what you understood. Then name each gap, conflict and risk with its evidence (a requirement ID, a file and line, a command's output), and ask the questions they raise. Ask a few at a time, as plain text in your own message, and end your turn to wait for the answers. Don't use the AskUserQuestion tool: the operator should be able to answer in their own words. Keep going until you have no question left, or the operator tells you to write. If the operator's message already answers a question, don't ask it again.

Only the operator decides. An answer you propose stays a question until they give it. When they decide something that changes the intent or the spec (a new or changed requirement, a settled concern or question), edit `intent.md` or `spec.md` now, following that document's template rules for changing it, including how an operator decision is marked. A change to the intent that the spec depends on is carried into the spec too. Keep a list of what you changed in each document for the hand-over.

## 7. Draft the plan and check every Proof item

Draft `plan.md` as `plan_template.md` says. Each step and each Proof item cites the requirements it covers, and every requirement is covered.

Before you write a Proof item, check that every command, tool, flag, make target and test path it names exists. A check confirms the item *can* run, not that it passes: the code it tests does not exist yet. Use only checks that make no model calls, start no billed run and change no file:

- a tool: `command -v <tool>`;
- a flag or subcommand: `<tool> --help` (or the subcommand's help), and look for it in the output;
- a make target: read the Makefile. Never run `make`;
- a test file or script: it exists, or it is listed as `(new)` in `## Files that change`.

When a check fails, don't write that item and don't write `plan.md` yet. Tell the operator what failed and why (the command you ran and what it showed), propose a check that does exist, and ask. Write the item only once they agree. A Proof item that cannot run gives false confidence, and nobody notices until review.

If the operator told you to write while some of your questions were still unanswered, put no step in the plan that rests on an unanswered question, and list each one in `## Risks` as undecided.

## 8. Write

If you are in plan mode, ask the operator to leave it, and wait. Then write.

- **New plan**: write `plan.md` in the change directory, following `plan_template.md` exactly, with `agent: claude` and `operator` set to the operator's name. Use a name the operator gave you in the conversation; failing that, the user's name from the session's context. If you have neither, ask.
- **Existing plan**: rework it in place, whenever the operator asks, even after implementation under it has started. Start from the current plan and the code as it stands, change what alignment changed, and keep the rest.

## 9. Hand over and stop

Tell the operator:

- the path of `plan.md`;
- the path of each other document you changed, and what changed in it, or that you changed none;
- any question listed as undecided in `## Risks`.

Ask them to review the plan and correct it. If they send corrections in this session, apply them. Then stop. Don't edit code, don't start implementation, and don't commit: the operator decides when the plan is accepted and when implementation begins.
