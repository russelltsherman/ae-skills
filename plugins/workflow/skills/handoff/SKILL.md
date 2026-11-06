---
name: handoff
description: "Writes a handoff of the current session (decisions with who raised them and whether the user accepted them, open questions, dead ends, references) to a file in .handoff/, so a fresh session can pick it up. Invoked only by /handoff."
disable-model-invocation: true
---

# Handoff

The user ran `/handoff` to carry what this session worked out into a fresh one. A raw conversation gives Claude's suggestions the same weight as the user's decisions, and compaction keeps whatever it chooses. The handoff file fixes that: it records who raised each idea, whether the user accepted it, and where it ended up, in fixed sections that the next step can rely on.

Running `/handoff` is the request to write the file, so don't ask for confirmation, and don't ask anything else either. Work through the steps below in order.

## The focus

The focus is this text: `$ARGUMENTS`

If it is empty, the handoff covers the whole session. Otherwise it covers only the parts of the session that bear on the focus, and leaves everything else out. Don't record anywhere that something was left out for being outside the focus. Without a focus, the file's topic is the session's topic. With one, the topic is the focus alone, so even the title says nothing about the rest of the session.

## 1. Find the handoff directory

Run `git rev-parse --show-toplevel` as a Bash call on its own. If it prints a path, the handoff directory is `<that path>/.handoff/`. If it fails for any reason (not a repository, or `git` not installed), the handoff directory is `.handoff/` in the current working directory, which your environment information already gives you. Use absolute paths from here on.

`/handoff` runs only two shell commands, this one and `date` in step 4, each as its own Bash call, with nothing chained to it: no `pwd`, `ls` or anything else. Everything else it needs comes from Read and from the conversation, so a run never touches the shell beyond those two read-only commands.

## 2. Check for `.handoff/.gitignore`

Read `<handoff directory>/.gitignore` with the Read tool, `limit: 1`. Content, or a note that the file exists but is empty, means it is present, whatever it contains. "File does not exist" means it is missing.

If it is missing, write nothing and reply with exactly this one line, then stop:

```
Nothing written: .handoff/.gitignore is missing in <handoff directory>. Run /workflow:init, then /handoff again.
```

Do this even when the session would have nothing to hand off. Never create or change `.handoff/.gitignore` yourself. `/workflow:init` owns it, and without it git would pick up handoff files. If the Read fails for any other reason, write nothing and say in one line what the error was.

## 3. Decide whether there is anything to hand off

There is something to hand off when the session, or with a focus the part of it that bears on the focus, holds at least one decision, open question, idea, dead end or constraint. Ignore this `/handoff` turn itself.

If there is nothing, write nothing and reply with exactly one line, then stop. Without a focus:

```
Nothing to hand off: this session holds no decisions, open questions, ideas, dead ends or constraints.
```

With a focus:

```
Nothing to hand off: nothing in this session bears on "<focus>".
```

## 4. Pick the file name

1. Run `date +%Y%m%d-%H%M` to get the timestamp.
2. Pick the slug: lowercase kebab-case, only `a-z`, `0-9` and `-`, at most five words. Take it from the focus when there is one, otherwise from the session's topic.
3. Read `<handoff directory>/<timestamp>-<slug>.md` with the Read tool, `limit: 1`. If the file exists, try `<timestamp>-<slug>-2.md`, then `-3.md`, and so on, until a Read reports that the file does not exist. That path is the file's path.

Never write to a path that a Read showed exists: an existing handoff file is someone's earlier work, and overwriting it loses it. Use Read for these checks, not Glob (which isn't in every Claude Code tool set) and not a shell test.

## 5. Write the file

Work out the whole file first, then write it with a single Write call. Don't write it and then rewrite it. Write it in exactly this shape: the title, then these headings in this order, and no others. Every heading is always there; a section with nothing to say holds `None.` Other skills find the sections by these headings, so don't rename, reorder or add any.

```markdown
# Handoff: <topic>

## Summary

## Decisions
### Accepted
### Rejected

## Open questions

## Dead ends and constraints

## References

## Left out
```

### Summary

A few sentences: what the session was about and where it ended up.

### Who decides

The user's messages decide what was accepted or rejected. Claude's messages are a source of ideas, never of decisions. This split is the point of the file: it is what lets the next step tell Claude's suggestions apart from the user's decisions.

- An item the user stated firmly is accepted, unless the user later dropped it, which makes it rejected.
- An item the user put as a question or a tentative idea ("maybe…", "what if…") is an open question with `no response`, unless the user later committed to it, which makes it accepted.
- An idea from Claude that the user accepted is accepted; one the user turned down is rejected. One the user never responded to goes under Open questions with `no response`, never under Decisions.
- Keep an idea for its bearing on the topic, whoever raised it. Weight the user's messages more, but don't drop a strong idea because Claude raised it.

### Decisions and Open questions

Every bullet says who raised the item, and that `(Raised by …)` clause always ends the bullet: put anything else, such as a `Was: …` clause, before it. Use these forms:

- A decision, under `### Accepted` or `### Rejected`:
  `- <item>. Reason: <reason>. (Raised by <user|Claude>; <accepted|rejected>.)`
  If no reason was ever given, write `Reason: not stated.`
- An open question, under `## Open questions`, with no `Reason:`:
  `- <item>. (Raised by <user|Claude>; <accepted|rejected|no response>.)`
- A request the user made that was declined or not carried out, also under `## Open questions`, in the past tense:
  `- The user asked to <request>. Declined: <why>. (Raised by user.)`

Record an item that changed during the session in its final form only, with the earlier form in a short `Was: …` clause when it matters: `- Sessions are stored in Postgres. Was: Redis. Reason: Redis is one more service to run. (Raised by user; accepted.)` The earlier form appears only in that clause. Don't also list it under `### Rejected`: the user didn't reject it as a separate idea, they changed their mind, and listing it twice makes one decision look like two.

Write every bullet, decisions included, as a statement or a question, never as an instruction. A bullet that starts with a verb telling someone what to do ("Use SQS", "Invoice monthly on the 1st", "Add a lock") reads like a task the next step should carry out. Write what was decided or proposed instead:

- a decision: "SQS is the queue.", "Invoices go out monthly on the 1st.", "Sessions are stored in Postgres.";
- an unanswered suggestion from Claude: "A lock so nightly runs can't overlap?" or "A lock so nightly runs can't overlap."

A question follows the same rule: start it with a noun, or with a word such as "Is", "Should" or "Which", never with a bare verb. "A prorated charge for the remaining days?", not "Prorate immediately?"; "Where does the app load the key?", not "Find where the app loads the key?". A choice between two actions is written with nouns too: "Deleting the entry or overwriting it on write?", not "Delete the entry on write, or overwrite it?".

The suggestions matter most: written as an instruction, an idea the user never answered turns into a decision.

Give each item to whoever raised it. When Claude offered options and the user picked one, the option was still raised by Claude: write `(Raised by Claude; accepted.)`, not `(Raised by user; …)`. Picking is accepting, not raising. When the user states a decision of their own that overlaps an idea of Claude's, keep the user's decision as its own bullet, `(Raised by user; accepted.)`, next to Claude's. Don't fold it into Claude's bullet, or the user's decision ends up credited to Claude.

A request that was declined and later withdrawn is still a single bullet, the declined-request one: put the withdrawal in its `Declined:` part, for example "Declined: the write was denied, and the user then said to leave it." Don't also record the withdrawal as a decision.

### Dead ends and constraints

Approaches that were tried or considered and didn't work, and limits found along the way, each with how it was found. A dead end belongs here even when it is also the reason for a decision. The decision gives the reason in one line, and this section keeps the record of what was tried and how it failed, which the next step needs if the question comes up again. For example: "Claude can't run `/clear`, so the user has to; found when asked to clear the session."

### References

The files, URLs and commands the session relied on, as paths or links only. Don't reproduce or describe what a file contains anywhere in the handoff, the Summary included (not its values, its keys or its sections). The next step can open the file itself, and a copy goes stale while the file changes.

### Left out

Never write a secret pasted into the session into the file, in whole or in part: keys, tokens, passwords, private keys, connection strings with credentials and the like. Where one would have appeared, write `[secret omitted]`, and add a bullet here saying what kind of secret it was and where in the session it appeared, without its value. List only secrets that would otherwise have appeared in the file. A secret in a part of the session outside the focus isn't mentioned at all. This section lists omitted secrets and nothing else; with none, it holds `None.`

### No next step

`/handoff` can't know what reads the file next, so the file stays neutral. No section, sentence or instruction is addressed to whatever reads it next, and no bullet is phrased as an imperative. That is why a declined request is written as "The user asked to…", not as a task.

### Example

```markdown
# Handoff: notify patrons when a hold is ready

## Summary
Worked out how patrons hear that a held book is ready. Settled on email and SMS with an opt-out; the reminder before expiry is still open.

## Decisions
### Accepted
- Patrons choose email, SMS or none. Reason: some patrons refuse SMS. (Raised by user; accepted.)
### Rejected
- Push notifications. Reason: there is no app. (Raised by Claude; rejected.)

## Open questions
- A reminder the day before a hold expires? (Raised by Claude; no response.)
- The user asked to write the spec now. Declined: the discussion was still open. (Raised by user.)

## Dead ends and constraints
- The SMS gateway batches every 30 minutes; found while checking its docs.

## References
- `services/holds/events.py`

## Left out
- An SMS gateway API key, pasted while checking the gateway docs.
```

## 6. Reply and stop

Reply with:

- the file's absolute path;
- that the user should run `/clear` before passing the file to the next step, so the next step starts from the file rather than from this conversation;
- optionally, one example of a likely next step that takes the path as its input, such as `/discuss <path>`.

Then stop: make no further tool calls. You can't run `/clear`, so never say or imply that the session was cleared.

## Limits

- Write only the handoff file. Create or change nothing else, inside or outside `.handoff/`, and delete nothing. Cleaning up old handoff files is the user's job.
- Use only these tools: Read, Write, and Bash for `git rev-parse --show-toplevel` and `date +%Y%m%d-%H%M`, each as its own call. Don't use any other skill, script or service.
