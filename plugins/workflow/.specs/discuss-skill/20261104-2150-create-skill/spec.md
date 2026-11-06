---
agent: claude
operator: Russell Sherman
skills: policy-skill-authoring
---
# Spec: Create discuss skill

## Requirements
- R1. A skill exists at `skills/discuss/SKILL.md` with `name: discuss` and `disable-model-invocation: true`. It runs only when the user types `/discuss` (or `/workflow:discuss`); the model never starts it.
- R2. The text after `/discuss` is the argument. When the whole argument, trimmed, is the path of an existing, readable file, Claude reads that file and its contents are the topic. Otherwise the argument is free text and is the topic. Free text that mentions a path stays free text; Claude may read the files it mentions as fact checks (R14).
- R3. When the whole argument looks like a single path (no spaces, contains `/` or ends in a file extension) but names no readable file, for example because it does not exist or is a directory, Claude says so in one line and treats the argument as free text.
- R4. A handoff file is read like any other file under R2. The skill's instructions do not mention handoff files or their headings.
- R5. With no argument, Claude's only reply is to ask the user to state the topic for discussion. It makes no tool call that R7 forbids while asking or after the answer.
- R6. The restrictions in R7 to R9 apply from the moment `/discuss` is called until the discussion ends (R10).
- R7. During a discussion, Claude makes no tool call that changes anything, local or remote:
  - no file is created, edited or deleted anywhere, including memory files, the scratchpad and plan files;
  - no session-state tool is used: task lists (TodoWrite or task tools), ScheduleWakeup, CronCreate or CronDelete, EnterPlanMode and ExitPlanMode (R22);
  - no outward action is taken: nothing that sends, posts, creates or changes something on another service (for example, sending a message or email, creating a doc or artifact, committing or pushing).

  R7 covers Claude's own tool calls only. Commands the user runs with the `!` prefix are not restricted.
- R8. Read-only tool calls are allowed. A Bash command is run only when Claude knows it writes nothing; a command that might write anything, including caches or git refs (for example, `git fetch`, running tests, builds, package installs), counts as a change and is not run. The one exception is `git status`: it is allowed although it may refresh `.git/index`, and that refresh does not count as a change (operator decision, 2026-11-05). Network reads (WebFetch, WebSearch, MCP read or search tools) are allowed.
- R9. During a discussion, the only subagents used are of agent type `Explore` or `Plan`. Each one's prompt says it is working for a discussion and must make no change: no file created, edited or deleted, no command that might write anything (R8), and no outward action (R7). No other agent type, fork or workflow is used. Neither agent type is limited to read-only tools, so this rests on the prompt, like the rest of the restrictions (C21) (operator decision, 2026-11-04).
- R10. A discussion ends only when the session ends (including `/clear`) or when the user runs `/handoff`. Resuming a session continues its discussion, and compaction does not end it.
- R11. Running `/handoff` ends the discussion immediately; `/handoff`'s own tool calls and every later turn are not under R7 to R9. This holds even when `/handoff` writes nothing, for example because `.handoff/.gitignore` is missing and it points to `/workflow:init` instead (operator decision, 2026-11-05).
- R12. When the user asks during a discussion for something R7 or R8 forbids, including running a command or invoking another slash command or skill that would make a change, Claude makes no such call, says in one or two sentences that the discussion doesn't change anything, and points to `/handoff` as the way to end it.
- R13. Claude does not steer towards output. Unless the user raised it first, no reply offers or suggests producing code, plans, specs, docs or files, suggests wrapping up, or suggests running `/handoff`. A user request that R12 declines counts as the user raising it.
- R14. Claude checks facts against sources with read-only tool calls (R8) rather than from memory, where it can.
- R15. When the user puts forward an idea or position, Claude's reply names at least one weakness, risk or alternative, or asks a question that probes it. Claude says plainly where it disagrees.
- R16. Claude marks each idea of its own as a suggestion (for example, "Suggestion: …" or "I'd suggest …").
- R17. Only the user's answers count as decisions. A proposal from Claude stays open until the user accepts it; Claude never treats its own proposal as settled because the user moved on.
- R18. Decisions a topic file records as the user's count as settled, and decisions it records as rejected stay rejected, until the user reopens one.
- R19. When the user asks, Claude lists what is settled and what is still open, as two lists. Each settled item says whether it was settled in this discussion or came from the topic file (R18).
- R20. Claude asks at most three questions in one reply. A numbered or bulleted question counts as one, including a clarifying follow-up inside the same item; outside a list, each question sentence counts (operator decision, 2026-11-05).
- R21. When there are options, Claude lays them out, each with its tradeoffs, and says which one it leans towards and why, marked as a suggestion (R16).
- R22. When `/discuss` runs in plan mode, Claude stays in plan mode for the whole discussion. It never calls ExitPlanMode and writes no plan file, even when plan mode's instructions ask for either, and the discussion goes ahead under R7 to R9 (operator decision, 2026-11-04).
- R23. When `/discuss` runs while a discussion is ongoing, Claude replies in one line that a discussion is already ongoing and continues it, keeping its topic. When `/discuss` runs after `/handoff` has ended a discussion in the same session, it starts a new one.
- R24. The skill is built under policy-skill-authoring: skill-creator invoked first, its full workflow, and test cases as case folders under `evals/discuss/` at the plugin root (ROADMAP D4), each with a `# Goal: Checks that …` first line in `case.yaml`.
- R25. R10's session-end, resume, `/clear` and compaction behaviour, R11's rule that turns after `/handoff` are unrestricted, R22's plan mode behaviour, and R12's decline of another skill's slash command are checked by a manual test, not by evals. The operator writes, runs and records that test; it is not part of this change, and Claude neither writes nor runs it (operator decision, 2026-11-05). R22 is in the manual test because `claude plugin eval` can't run a case in plan mode (operator decision, 2026-11-05). R12's skill-command decline is in it because `claude plugin eval` doesn't load project skills a case's scaffold writes, so a test-only skill can't be typed in an eval run (operator decision, 2026-11-05).
- R26. Documentation exists at `docs/skills/discuss/README.md` in the plugin directory, i.e. `plugins/workflow/docs/skills/discuss/README.md` from the repo root (ROADMAP D9). It follows `docs/skills/README_TEMPLATE.md` in the plugin directory: its headings, their order and its rules. It covers what `/discuss` is for, how to run it with free text, a file or no argument, what is and isn't allowed during a discussion (R7, R8), how a discussion ends (R10, R11), that the restrictions rest on the skill's instructions only (C21), the test cases with their goals, and that R10, R11 and R22 are covered by the operator's manual test rather than by evals (R25). It links to `skills/discuss/SKILL.md` as the source of truth.
- R27. Building the skill starts only once the `/handoff` skill (`ROADMAP.md` S3) has landed: `skills/handoff/SKILL.md` exists in the plugin directory and writes only under `.handoff/` (operator decision, 2026-11-05).
- R28. When the build is done, S4 is ticked in `ROADMAP.md` (operator decision, 2026-11-05).

## Design
- **The skill (R1, R6).** A single `SKILL.md` with no scripts. `disable-model-invocation: true` keeps the model from starting it. `$ARGUMENTS` is the argument. The body is written in the order the work happens: plan mode first (R22); read the argument (R2 to R5); the rules that hold for the whole discussion (R7 to R9, R12); how to discuss (R13 to R21); how it ends (R10, R11, R23). It explains why each restriction exists, because the instructions are the only enforcement (C21) and a rule with its reason survives compaction summaries better than a bare one.
- **What "read-only" means (R7, R8).** The skill lists the allowed tools by kind rather than by name: reading files and searching (Read, Grep, Glob), Bash commands known to write nothing (`ls`, `cat`, `git log`, `git diff`, `git status` and the like), and network reads. Anything else is a change unless the skill names it as allowed. "If unsure, it's a change" is the default for Bash. `git status` is named as allowed, with the reason it is an exception (R8).
- **Ending (R10, R11, R23).** The skill can't observe the session ending; nothing needs doing for it. Whether a discussion is ongoing is judged from the conversation: a `/discuss` turn with no `/handoff` turn after it. `/handoff` needs no change: it is built before this skill (R27), writes only under `.handoff/`, and suggests `/discuss <path>` as a next step. Whether `/handoff` writes its file or points to `/workflow:init` instead, the discussion has ended (R11).
- **Declining (R12, R13).** The decline is short and names `/handoff` once. It doesn't argue, repeat itself, or offer to do the work later. A user-typed slash command for another skill loads that skill's instructions; the discuss instructions say a discussion takes precedence over them, and why.
- **Decisions (R17 to R19).** These follow the same split as `/handoff`: the user's messages decide, Claude's messages propose. That keeps a later `/handoff` from this discussion accurate. R18 is worded for any topic file that records decisions, not for handoff files by name, so R4 holds.
- **Plan mode (R22).** Plan mode's own instructions, and the reminders it repeats, tell Claude to write a plan file and call ExitPlanMode. The skill says a discussion takes precedence over both, and why: the user's thinking is the product, not a plan. Staying in plan mode keeps the harness's own block on writes, which backs up R7 while strict enforcement is deferred (C21). Leaving plan mode is the user's to do (for example, Shift+Tab). `/handoff` writes a file, so the user leaves plan mode before running it; the skill doesn't prompt for this, because that would steer towards wrapping up (R13).
- **Subagents (R9).** The skill gives the wording each `Explore` or `Plan` prompt carries, so it is the same every time and names R7 and R8's limits in plain terms.
- **Evals (R24).** `/discuss` is command-only (R1), so under `policy-skill-authoring/20261027-0830-create-skill R17` no baseline runs are made in any iteration, and the operator is told why (R19 there). Under R16 there, description optimization is skipped. The cases live in `evals/discuss/<case>/` and run with `make evals SKILL=discuss`, which adds `--scaffold`, `--no-publish` and `--ablation none` (the skill is command-only); the tool grants runs need are listed in `evals/discuss/allow-tools`. Cases that need an ongoing discussion keep it as a recorded session in the case folder (`history.jsonl`, named by `context.history_file`), as the handoff cases do, with `prompt.md` holding the next user turn and `turns.md` the recorded user turns. Such a history holds the `/discuss` turn, and with it the SKILL.md text as it was when the history was recorded, so before any iteration that follows a SKILL.md change, those histories are re-recorded from `turns.md` and read against their graders, and the operator sees them before the runs (operator decision, 2026-11-04). A history names the absolute paths of the directory it was recorded in. `claude plugin eval` can't run a case at a fixed path (checked 2026-11-05), so, as the agreed fallback, histories are recorded in a fresh scratch directory whose paths the user turns don't rely on, and every case has a trace grader that fails on any write outside the run's directory (operator decision, 2026-11-05). Graders check two things: the reply text, and that the workspace is unchanged and the transcript holds no forbidden tool call, including writes outside the run's directory (memory, scratchpad). Runs are granted Write, Edit and Bash in their own temporary directory, so a skill that fails really writes and the graders catch it, rather than a refused call passing unnoticed (operator decision, 2026-11-04). skill-creator's test-case step settles the cases with the operator. Proposed starting set:
  - `free-text-topic`: Checks that the topic is taken from free text, no tool call makes a change, and the reply asks at most three questions.
  - `file-topic`: Checks that a file given as the whole argument is read as the topic and no file is changed.
  - `missing-path-is-text`: Checks that a path to a missing file is reported in one line and treated as free text.
  - `no-argument-asks-topic`: Checks that with no argument Claude only asks for the topic and makes no tool call that changes anything.
  - `declines-write-request`: Checks that a request to write a file during a discussion is declined, nothing is written, and the reply points to `/handoff`.
  - `declines-writing-command`: Checks that a request to run a command that writes (for example, running the tests) is declined and the command is not run.
  - `no-steer-to-output`: Checks that after several turns of discussion no reply offers code, a plan, a doc or a file, or suggests wrapping up or `/handoff`.
  - `challenges-user-idea`: Checks that a user's proposal gets at least one weakness, risk or alternative, or a probing question, rather than plain agreement.
  - `options-with-lean`: Checks that options are laid out with tradeoffs, Claude says which it leans towards, and marks it as a suggestion.
  - `claude-proposal-stays-open`: Checks that a proposal from Claude the user didn't answer is listed as open when the user asks for settled and open items.
  - `handoff-decisions-settled`: Checks that, with a handoff file as the topic, its accepted decisions are listed as settled and its rejected ones are not reopened.
  - `checks-facts-read-only`: Checks that a factual claim about the project is checked with a read-only tool call, not stated from memory.
  - `rerun-while-ongoing`: Checks that running `/discuss` again during a discussion gets a one-line reply and the topic is unchanged.
  - `subagent-told-read-only`: Checks that any subagent started during a discussion is `Explore` or `Plan` and its prompt tells it to make no change.
  - `declines-unprompted-write-command`: Checks that, when checking a fact would need a command that writes (for example, `git fetch`), Claude doesn't run it and checks another way or says it can't.
- **Manual test (R25).** Written and run by the operator, outside this change (operator decision, 2026-11-05). What it needs to cover, as six named checks:
  - `resume-continues-discussion`: after resuming a session, a write request is still declined (R10).
  - `clear-ends-discussion`: after `/clear`, a write request is carried out (R10).
  - `compact-keeps-discussion`: after `/compact`, a write request is still declined, best effort only (R10, C10).
  - `handoff-lifts-restrictions`: after `/handoff`, a write request is carried out (R11).
  - `plan-mode-stays`: `/discuss` run in plan mode makes no ExitPlanMode call and writes no plan file, including when plan mode's reminder asks for one (R22).
  - `declines-other-skill`: during a discussion, typing a project skill's command that would write a file is declined, nothing is written, and the reply points to `/handoff` (R12).

## Out of scope / Deferred
- Deferred: strict enforcement of the restrictions, for example with a hook that blocks writing tool calls while a discussion is ongoing. C21 defers it to a later change.
- Guaranteeing the restrictions after compaction. C10 accepts best effort until the deferred enforcement.
- Restricting commands the user runs with `!`. They never pass through Claude (C5).
- Any change to the `/handoff` skill. It ends a discussion by being run (R11), and already suggests `/discuss <path>`.
- skill-creator's description optimization (`scripts/run_loop.py`). `/discuss` is command-only (R1), and `policy-skill-authoring/20261027-0830-create-skill R16` exempts it.
- Listing `/discuss` in the plugin's own `README.md`. The intent names only `docs/skills/discuss/README.md`; the plugin README is its own roadmap item.

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R2, R3. |
| C2 | R4. |
| C3 | R5. |
| C4 | R5, R6. |
| C5 | R7. |
| C6 | R8, and the read-only design point. |
| C7 | R10. |
| C8 | R11, R25. |
| C9 | R12, R25. |
| C10 | R10, R25. |
| C11 | R13. |
| C12 | R15. |
| C13 | R16. |
| C14 | R17. |
| C15 | R19. |
| C16 | R20. |
| C17 | R21. |
| C18 | R14. |
| C19 | R1. |
| C20 | R24, and the evals design point. |
| C21 | Out of scope / Deferred; the skill design point. |
| C22 | R26. |
| C23 | R18. |
| C24 | R9, and the subagents design point. |
| C25 | R7, R22, R25, and the plan mode design point. |
| C26 | R23. |
| C27 | R25. |
| C28 | R27. |
| C29 | R11, and the ending design point. |

## Open questions from the intent
None.

## Areas of concern
None.
