# discuss

Starts a discussion in which your thinking is the product and nothing is written or changed. Source of truth: [`skills/discuss/SKILL.md`](../../../skills/discuss/SKILL.md).

## What it does

`/discuss` turns the session into a thinking partner for one topic. Claude asks questions, lays out options with their tradeoffs and says which it leans towards, checks facts against the project with read-only lookups, and says where it disagrees. While the discussion is ongoing, it creates, edits or deletes no file, runs no command that writes, and takes no outward action.

Without it, Claude keeps pulling a conversation towards output: outside plan mode it wants to write code, inside plan mode it wants to write a plan. In a discussion it doesn't offer code, plans, docs or files, and doesn't suggest wrapping up. You decide when the thinking is done.

Only your answers count as decisions. An idea from Claude stays open until you accept it, even if you move on without answering it.

## When to use it

- You want to think a topic through before deciding anything, without being pushed towards a deliverable.
- You want a decision challenged: weaknesses, risks and alternatives, not agreement.
- You want to pick up an earlier session's thinking from a file, such as a `/handoff` file, and keep going.

Not for:

- Writing the plan, spec or code once you've decided. End the discussion with `/handoff`, then run that step.
- Changing anything while you think. Run the change yourself with `!`, or end the discussion first.

It runs only when you type `/discuss` (or `/workflow:discuss`); the model never starts it.

## How to use it

Give the topic as free text, or as the path of a file to read:

```
> /discuss whether we should move our three services into a monorepo
> /discuss .handoff/20261105-1432-session-storage.md
```

- **Free text** is the topic. Text that mentions a path stays free text; Claude may read the files it mentions to check facts.
- **A file**: when the whole argument is the path of a readable file, Claude reads it and its contents are the topic.
- **A path that doesn't work**: when the argument looks like a single path but names no readable file (missing, or a directory), Claude says so in one line and discusses the argument as free text.
- **No argument**: Claude asks what you'd like to discuss, and nothing else.

Ask "what's settled and what's still open?" at any point to get two lists. Each settled item says whether it was settled in this discussion or came from the topic file.

## Details

### What is and isn't allowed

From the moment `/discuss` runs, including while Claude asks for the topic:

- No file is created, edited or deleted anywhere, including memory, scratchpad and plan files.
- No session-state tool is used: task lists, scheduled wakeups, cron jobs, entering or leaving plan mode.
- No outward action: nothing is sent, posted, created or changed on another service, and nothing is committed or pushed.

Reading is allowed and used for fact checks: reading and searching files, Bash commands known to write nothing (`ls`, `cat`, `git log`, `git diff` and the like), web fetches and searches, and MCP tools that only read. A Bash command that might write anything, including caches or git refs, counts as a change: `git fetch`, `git pull`, test runs, builds and installs are not run. When a check would need one, Claude checks another way (for example with `git ls-remote`) or says it can't check here.

`git status` is the one exception. It may refresh `.git/index`, and that refresh doesn't count as a change, because checking what is modified is so often what a fact check needs.

Commands you run yourself with `!` are yours and aren't restricted.

### Declining

When you ask for something the discussion doesn't allow, such as writing a file, running a command that writes, or another skill's command that would make a change, Claude doesn't do it. It says in a sentence or two that the discussion doesn't change anything, points to `/handoff` once, and carries on with the discussion.

### Subagents

Claude may start a subagent to search or read, but only of type `Explore` or `Plan`, and every one is told in its prompt to make no change. No other agent type, fork or workflow is used.

### Topic files with decisions

When the topic file records decisions, those it records as yours count as settled, and those it records as rejected stay rejected, until you reopen one. A `/handoff` file works this way with no special handling.

### Plan mode

Run in plan mode, `/discuss` stays in plan mode for the whole discussion. It doesn't call ExitPlanMode or write a plan file, even when plan mode's reminders ask for one. Leaving plan mode is up to you (for example, Shift+Tab). `/handoff` writes a file, so leave plan mode before you run it.

### How a discussion ends

- `/handoff` ends it at once. From that turn on, nothing is restricted, including when `/handoff` writes nothing and points you to `/workflow:init` first.
- The session ending ends it, and `/clear` counts as the session ending.
- Resuming a session continues its discussion, and so does compaction.
- `/discuss` run again during a discussion gets a one-line reply and the discussion keeps its topic. After `/handoff`, `/discuss` starts a new one.

## Limits

- The restrictions rest on the skill's instructions only. Nothing blocks a writing tool call while a discussion is ongoing; strict enforcement, for example with a hook, is left to a later change.
- After compaction, how well the restrictions hold depends on what compaction keeps.
- It doesn't restrict commands you run with `!`.
- It doesn't prompt you to leave plan mode before `/handoff`, because that would steer towards wrapping up.

## Test cases

The skill's test cases live in [`evals/discuss/`](../../../evals/discuss/). Each goal is the first line of the case's `case.yaml`.

The evals run with no baseline, because the skill is command-only. Cases that need a discussion already under way resume a recorded session (`history.jsonl`) and send the next turn; each such case's `turns.md` lists the user turns, so the history can be re-recorded. Session end, resume, `/clear` and compaction (R10), turns after `/handoff` (R11), plan mode (R22) and declining another skill's command (R12) are covered by the operator's manual test, not by these evals, because `claude plugin eval` can't run a case in plan mode or load a project skill a case places.

| Case | Goal |
| :---- | :---- |
| `challenges-user-idea` | Checks that a user's proposal gets at least one weakness, risk or alternative, or a probing question, rather than plain agreement. |
| `checks-facts-read-only` | Checks that a factual claim about the project is checked with a read-only tool call, not stated from memory. |
| `claude-proposal-stays-open` | Checks that a proposal from Claude the user didn't answer is listed as open, not settled, when the user asks for settled and open items. |
| `declines-unprompted-write-command` | Checks that, when checking a fact would need a command that writes such as git fetch, Claude doesn't run it and checks another way or says it can't. |
| `declines-write-request` | Checks that a request to write a file during a discussion is declined, nothing is written, and the reply points to /handoff once. |
| `declines-writing-command` | Checks that a request to run a command that writes is declined during a discussion and the command is not run. |
| `file-topic` | Checks that a file given as the whole argument is read as the topic and no file is changed. |
| `free-text-topic` | Checks that free text after /discuss is the topic, no tool call makes a change, and the reply asks at most three questions. |
| `handoff-decisions-settled` | Checks that, with a handoff file as the topic, its accepted decisions are listed as settled from the topic file and its rejected ones are not reopened. |
| `missing-path-is-text` | Checks that a path to a missing file is reported in one line and the argument is then treated as free text. |
| `no-argument-asks-topic` | Checks that with no argument Claude only asks for the topic and makes no tool call that changes anything. |
| `no-steer-to-output` | Checks that after several turns of discussion no reply offers code, a plan, a doc or a file, or suggests wrapping up or /handoff. |
| `options-with-lean` | Checks that options are laid out with their tradeoffs, Claude says which it leans towards and why, and marks the lean as a suggestion. |
| `rerun-while-ongoing` | Checks that running /discuss again during a discussion gets a one-line reply and the topic is unchanged. |
| `subagent-told-read-only` | Checks that a subagent started during a discussion is Explore or Plan and its prompt tells it to make no change. |
