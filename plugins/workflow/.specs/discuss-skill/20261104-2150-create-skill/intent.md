---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: Create discuss skill

## Problem
When the user wants to think a topic through, Claude keeps pushing the conversation towards output. Outside plan mode it tends to want to write code; inside plan mode it tends to want to write a plan document. There is no way to start a discussion in which the user's thinking is the product and nothing gets written or changed while the discussion is ongoing.

## Proposed outcome
A new `/discuss` command starts a discussion in which the user's thinking is the product. The topic is given as free text or as a file to read. While the discussion is ongoing, nothing is written or changed anywhere. Claude helps the user think: it asks questions, lays out options with their tradeoffs, checks facts, and challenges ideas, without steering the conversation towards output. Only the user's answers count as decisions. The discussion ends when the session ends or when the user runs `/handoff`.

## Affected users and systems
- Users: anyone who wants to think a topic through in Claude Code without being pushed towards code, a plan or another deliverable.
- Systems: a new skill in `skills/discuss/`, its eval cases in `evals/discuss/`, and its documentation at `docs/skills/discuss/README.md`, all in the plugin directory. The `/handoff` skill is how a discussion ends.

## Constraints
- C1. `/discuss` accepts free text or a file path as its argument. The argument is a file only when the whole argument is the path of an existing, readable file; the file is read, and its contents are the topic of discussion. Any other argument is free text, including text that mentions a path; Claude may read files it mentions as fact checks (C18). When the whole argument looks like a path but names no readable file (for example, it does not exist or is a directory), Claude says so in one line and treats the argument as free text.
- C2. A handoff file is read like any other file, with no special treatment.
- C3. When no argument is given, Claude asks the user to state the topic for discussion.
- C4. The discussion's restrictions apply from the moment `/discuss` is called, including while Claude asks for the topic.
- C5. During a discussion, no tool call makes a change anywhere, local or remote: no file is created, edited or deleted in this project or any other, no memory or scratch file is created, no session-state tool is used (task lists, scheduled wakeups, cron jobs, `EnterPlanMode`, `ExitPlanMode`), and no outward action is taken (for example, sending a message or email, creating a doc or artifact, committing or pushing). C5 covers Claude's own tool calls only; commands the user runs directly with the `!` prefix are not restricted.
- C6. Read-only tool calls are allowed during a discussion. A Bash command is run only when Claude knows it writes nothing; a command that might write anything, including caches or git refs (for example, `git fetch`, test runs, builds), counts as a change. Network reads (fetching a URL, web search, MCP read or search tools) are allowed; an outward action is one that sends, posts, creates or changes something.
- C7. A discussion ends only when the session ends or when the user calls `/handoff`.
- C8. Calling `/handoff` ends the discussion immediately, so the tool calls that follow are not under the discussion's restrictions.
- C9. When the user asks for something that would make a change during a discussion, including running a command or invoking another slash command or skill that would, Claude declines and points to `/handoff`.
- C10. Resuming a session continues its discussion. `/clear` counts as the session ending. Compaction does not end a discussion; how well the restrictions hold after compaction rests on what compaction keeps, and that is accepted until the enforcement deferred by C21.
- C11. Claude does not steer towards output: it does not offer or suggest producing code, plans, specs, docs or files, and does not suggest wrapping up or running `/handoff`, unless the user raises it. A request from the user that would make a change counts as raising it, so pointing to `/handoff` under C9 is allowed.
- C12. Claude engages critically: it asks questions, lays out tradeoffs, and says where it disagrees. When the user puts forward an idea or position, Claude's reply names at least one weakness, risk or alternative, or asks a question that probes it.
- C13. Claude marks its own ideas as suggestions.
- C14. Only the user's answers count as decisions. A proposal from Claude stays open until the user accepts it.
- C15. When the user asks, Claude shows what is settled and what is still open.
- C16. Claude asks at most three questions in one turn.
- C17. When there are options, Claude lays them out with their tradeoffs and says which one it leans towards.
- C18. Claude checks facts against sources with read-only tool calls rather than from memory, where it can.
- C19. The skill starts only when the user runs `/discuss`. It is never invoked by the model.
- C20. Built under the repo's skill-authoring policy.
- C21. Strict enforcement of the discussion's restrictions is deferred to a later change. In this change, they rest on the skill's own instructions.
- C22. The skill is documented in a `README.md` at `plugins/workflow/docs/skills/discuss/` from the repo root, following the skill README template at `plugins/workflow/docs/skills/README_TEMPLATE.md`.
- C23. Decisions a topic file records as the user's count as settled for C14 and C15, and decisions it records as rejected stay rejected, until the user reopens one.
- C24. Subagents are used during a discussion only when their agent type is `Explore` or `Plan`, and the subagent's prompt tells it to make no change, as C5 and C6 define one. No general-purpose agents, other agent types, forks or workflows.
- C25. When `/discuss` is run in plan mode, Claude stays in plan mode: it does not call `ExitPlanMode` and writes no plan file, even though plan mode's own instructions ask for both.
- C26. Running `/discuss` while a discussion is ongoing does not start a new one; Claude says in one line that a discussion is already ongoing and continues it. Running `/discuss` after `/handoff` has ended a discussion starts a new one.
- C27. C7, C8 and C10 (session end, resume, `/clear`, compaction, and turns after `/handoff`) are verified by a manual test, not by evals. The operator writes and runs it; it is not part of this change.
- C28. The skill is built only after the `/handoff` skill (`ROADMAP.md` S3) has landed.
- C29. Running `/handoff` ends the discussion even when `/handoff` itself writes nothing, for example because `.handoff/.gitignore` is missing and it points to `/workflow:init` instead.

## Open questions
None.

## Action already taken
None.
