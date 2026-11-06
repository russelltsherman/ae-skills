# handoff

Writes what a session worked out to a file in `.handoff/`, so a fresh session can pick it up. Source of truth: [`skills/handoff/SKILL.md`](../../../skills/handoff/SKILL.md).

## What it does

`/handoff` summarises the current session into one Markdown file in `.handoff/`. The file records the decisions, saying who raised each one and whether you accepted or rejected it. It also records the open questions, the dead ends and constraints found along the way, and the files and links the session relied on.

Without it, the next step works from the raw conversation, where Claude's suggestions carry the same weight as your decisions, or from whatever automatic compaction chose to keep. In the handoff file, only your messages decide what was accepted. An idea of Claude's that you never answered stays an open question.

It finishes by giving you the file's path and telling you to run `/clear` before you pass the file on.

## When to use it

- You've thought something through in a session and want to carry the result into a fresh one, for example from an open discussion to writing down what was decided.
- A long session is near compaction, and you want who-decided-what kept on your terms.
- You want to hand one thread of a wider session on, by giving a focus.

Not for:

- Writing a plan, spec or code from the session. The file is neutral and names no next step; run that step yourself, with the file as its input.
- Cleaning up old handoff files. That's left to you.

It runs only when you type `/handoff` (or `/workflow:handoff`); the model never starts it.

## How to use it

Run `/workflow:init` once in the project first. Then type `/handoff`, with an optional focus. It asks nothing before writing.

```
> /handoff
I wrote the handoff file to /home/me/src/shop/.handoff/20261105-1432-hold-notifications.md.

Run /clear before passing it to the next step, so that step starts from the file and not from this conversation.
A likely next step is /discuss /home/me/src/shop/.handoff/20261105-1432-hold-notifications.md.
```

With a focus, the handoff covers only the parts of the session that bear on it, and the slug and title come from it:

```
> /handoff billing
I wrote the handoff file to /home/me/src/shop/.handoff/20261105-1440-billing.md.
...
```

Claude can't run `/clear`, so you run it, then start the next step with the file's path.

## Details

### Where the file goes

Inside a git repository, the file goes in `.handoff/` at the repository's root, even when you run `/handoff` from a subdirectory. Outside a repository, or when `git` isn't installed, it goes in `.handoff/` in the current directory. The name is `<YYYYMMDD-HHMM>-<slug>.md`. If that name is taken, `-2`, `-3` and so on are added; an existing handoff file is never overwritten.

### `.handoff/.gitignore` comes from `/workflow:init`

`/handoff` writes only when `.handoff/.gitignore` exists, so a handoff file never lands somewhere git would pick it up. The file's content doesn't matter; your own version is respected. `/handoff` never creates or changes it. When it's missing, `/handoff` writes nothing and replies in one line:

```
Nothing written: .handoff/.gitignore is missing in /home/me/src/shop/.handoff. Run /workflow:init, then /handoff again.
```

`/handoff` also writes nothing when there's nothing to hand off, and says so in one line. With a focus, that line names the focus.

### The file's sections

Every handoff file has exactly these headings, in this order, so other skills can find each section by its heading. A section with nothing in it holds `None.`

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

- **Decisions** bullets read `- <item>. Reason: <reason>. (Raised by <user|Claude>; <accepted|rejected>.)`. An item that changed during the session is listed once, in its final form, with the earlier form in a `Was: …` clause.
- **Open questions** bullets read `- <item>. (Raised by <user|Claude>; <accepted|rejected|no response>.)`. Something you put as "maybe…" stays here until you commit to it. A request of yours that was declined is recorded as `- The user asked to <request>. Declined: <why>. (Raised by user.)`.
- **References** lists paths and links only, never what the files contain.
- **Left out** lists secrets that were kept out of the file (their kind and where they appeared, never their value), and nothing else. Topics outside a focus are dropped without a note.

No bullet is phrased as an instruction, and nothing in the file is addressed to whatever reads it next.

### Cleaning up

Handoff files are temporary. Nothing deletes them; remove old ones from `.handoff/` when you no longer need them.

## Limits

- It writes only the handoff file: nothing else, inside or outside `.handoff/`, and it never deletes anything.
- It can't run `/clear` or start the next step.
- It summarises what's still in the session. If the session was already compacted, the handoff can only work from what compaction kept.
- It runs only `git rev-parse` and `date` in the shell, and uses no other skill or service.

## Test cases

The skill's test cases live in [`evals/handoff/`](../../../evals/handoff/). Each goal is the first line of the case's `case.yaml`.

The evals run with no baseline, because the skill is command-only. Most cases resume a recorded session (`history.jsonl`) and type `/handoff` as the next turn; each case's `turns.md` lists the user turns, so the history can be re-recorded.

| Case | Goal |
| :---- | :---- |
| `attributes-ideas` | Checks that each decision and open question says who raised it and whether the user accepted, rejected or did not respond, including a tentative remark from the user that stays open. |
| `declined-request-recorded` | Checks that a request declined during the session is under Open questions in the past-tense The user asked to form, not as an instruction. |
| `file-names-no-next-step` | Checks that the file contains no instruction or suggestion addressed to a next step. |
| `focus-matches-nothing` | Checks that no file is created when the focus matches nothing in the session, and the one-line reply names the focus. |
| `focus-sets-slug-and-scope` | Checks that the slug and title come from the focus, and that an unrelated topic and the fake secret pasted in it are left out of the file and of Left out. |
| `gitignores-unchanged` | Checks that a handoff is written when .handoff/.gitignore holds something other than *, and that it and the project's .gitignore are unchanged. |
| `missing-gitignore-points-to-init` | Checks that with no .handoff/.gitignore, in a session with something to hand off, no file or directory is created and the one-line reply tells the user to run /workflow:init. |
| `no-overwrite` | Checks that an existing handoff file with the same name is never written to and the new file gets a -2 suffix. |
| `nothing-to-hand-off` | Checks that in an empty session no file is created besides the placed .handoff/.gitignore and the reply is one line. |
| `outside-git-repo` | Checks that the handoff file is written to .handoff/ in the current directory when it is not inside a git repository. |
| `records-final-position` | Checks that a decision changed mid-session is recorded in its final form only, with the earlier form in a Was clause. |
| `secret-omitted` | Checks that a pasted API key appears nowhere in the written file and Left out records its omission. |
| `unanswered-suggestion-stays-open` | Checks that a suggestion from Claude the user never answered is under Open questions with no response, not under Accepted. |
| `writes-full-handoff` | Checks that /handoff writes a file in .handoff/ with a timestamped name and every fixed section in order, records the dead end and the file reference, asks nothing first, and replies with the path and an instruction to run /clear. |
