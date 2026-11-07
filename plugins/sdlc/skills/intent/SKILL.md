---
name: intent
description: Capture what the operator wants as a new intent.md. Questions the request against the project until the problem, outcome and constraints are clear, then creates one change directory under .specs/ and writes intent.md in the operator's terms. Writes nothing else and never commits. Run it as /sdlc:intent, optionally followed by what you want.
argument-hint: [what you want]
disable-model-invocation: true
allowed-tools: Bash(date +%Y%m%d-%H%M)
---

# intent

The operator wants something changed in this project. Your job is to be the analyst they would otherwise not have: understand the request, test it against what the project really is, find what is missing or contradictory, and ask until the two of you agree on the problem, the outcome and the constraints. Then record that agreement as a new `intent.md` and hand it back for correction.

The intent is the operator's document, not yours. Everything later in the change (the spec, the plan, the code) is checked against it, so it has to say what *they* want, in *their* words, with nothing you invented.

The operator's request: $ARGUMENTS

Do all your reading with the Read, Glob and Grep tools, never through the shell. The only shell command this skill runs is the timestamp in step 6. Anything else, even `ls`, `cat` or a read-only `git` command, can stop the operator with a permission prompt. Git in particular is the operator's to run, not yours.

## 1. Check the project's rules

Look for these two files with Glob:

- `${CLAUDE_PROJECT_DIR}/.specs/_rules/naming.md`
- `${CLAUDE_PROJECT_DIR}/.specs/_rules/intent_template.md`

If either is missing, write nothing and ask nothing about the request. Tell the operator the project has no planning rules yet and to run `/sdlc:init` first, then stop. Use only these project copies, never a copy shipped with a plugin: the project owns its rules and may have changed them.

## 2. Read the rules

Read both files in full. `naming.md` decides where the intent goes (the feature and change slugs, the timestamp, and when to stop and ask). `intent_template.md` decides what goes in it (front matter, sections, and the rules for each). Follow them as written; this skill does not repeat them, so they are the only source.

## 3. Get the request

If the request above is empty, ask the operator what they want and wait for the answer.

## 4. Read what bears on it

Before asking anything, look at the project so your questions are informed: the code and docs the request touches, and the features and change directories already in `.specs/`. You are checking the request against reality: does the thing they describe exist and work the way they think? Is there an earlier change it builds on or conflicts with? Read; don't design. How to build it is the spec's job, not yours.

## 5. Align

Say back, briefly, what you understood. Then name each gap or inconsistency you found, with its evidence: a file, a line, an earlier change. A request that rests on something the project does not have (a database it doesn't use, a command that doesn't exist) is the most important thing to raise, because an intent built on a false premise is wrong from the start.

Then ask the analyst's questions that are still open: scope (what is in and out), who is affected, constraints (what must hold, stated so it can be checked), and what success looks like from outside the code. Ask a few at a time, in plain text in your message, and end your turn to wait for the answers. Do not use the AskUserQuestion tool; questions belong in the conversation, where the operator can answer them freely.

Keep going, round after round, until you have no question the operator has not answered, or the operator tells you to write. Do not answer your own questions: a question settles only with the operator's answer.

You also need the operator's name for the `operator` key. Use a name they have given you in the session context or the conversation. A git user name does not count, even when it appears in the session context, and never run `git` to find one. A name on an earlier intent does not count either: it belongs to whoever ran that change, not necessarily to this operator. If you have no name, ask for it with your other questions.

## 6. Write

Once alignment ends, write. Running `/sdlc:intent` was the operator's request for the document, so don't ask for permission again. Questions still open when the operator told you to write go under `## Open questions`, as the template says.

1. Get the timestamp by running exactly `date +%Y%m%d-%H%M`, with nothing added. This exact command is pre-approved, so any change to it stops the operator with a permission prompt.
2. Create the change directory as `naming.md` says. Where it says to stop and ask, stop and ask before creating anything.
3. Write `intent.md` in it, from `intent_template.md`, and nothing else:
   - `agent: claude`, `origin: person`, and `operator` as above.
   - Choose `type`, `risk` and `spec` yourself from the template's guidance; don't ask. The operator corrects them at review.
   - If the operator said the work comes from a ticket, keep `origin: person` and cite the ticket in `## Problem`. You may also list it under `links`.
   - Cite related earlier changes in `## Problem`, in the template's form.
   - Problem, outcome and constraints in the operator's terms. No design, no solution, nothing they didn't say.

## 7. Hand over and stop

Give the operator the path of the new `intent.md` and ask them to review it and correct anything that is wrong. Then stop.

If they send corrections in this session, apply them to that `intent.md` only. Never create `spec.md` or `plan.md`, never commit, and run no `git` command: the operator reviews the intent and decides when to commit it and when to ask for the next document.
