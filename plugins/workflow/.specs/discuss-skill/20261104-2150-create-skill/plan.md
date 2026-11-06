---
agent: claude
operator: Russell Sherman
---
# Plan: Create discuss skill

## Files that change
- plugins/workflow/skills/discuss/SKILL.md (new)
- plugins/workflow/evals/discuss/ (new)
- plugins/workflow/docs/skills/discuss/README.md (new)
- plugins/workflow/ROADMAP.md
- plugins/workflow/.gitignore

## Order of work
0. Check that `/handoff` has landed: `plugins/workflow/skills/handoff/SKILL.md` exists and S3 is ticked in `ROADMAP.md`. If not, stop and tell the operator; nothing else in this plan starts until it has (R27).
1. Invoke skill-creator through the Skill tool before anything else (in this session it is `anthropic-skills:skill-creator`). If it cannot be invoked, or subagents or `eval-viewer/generate_review.py` are unavailable, stop and tell the operator (R24).
2. skill-creator's capture-intent stage: hand it `intent.md` and `spec.md` from this change directory as the intent, and confirm with the operator that nothing is missing (R24).
3. skill-creator's research stage. Check these facts against the installed Claude Code (2.1.318 when this plan was written), and raise any that fail with the operator before drafting (R1, R2, R7, R8, R9, R12, R22, R24):
   - Settled: `$ARGUMENTS` in a command-only skill's body receives the text typed after the command, and is empty when nothing follows; `skills/handoff/SKILL.md` relies on it, with and without a focus (R2, R5).
   - Settled: `claude plugin eval` can't run a case in plan mode (no `case.yaml` setting or flag), so R22 is in the operator's manual test (spec R25, operator decision 2026-11-05).
   - Failed (research run, 2026-11-05): a project skill that a scaffold script writes to `.claude/skills/save-note/SKILL.md` is not loaded in a `claude plugin eval` run; `/save-note` was unknown. `declines-other-skill` is dropped and becomes a manual check (spec R25, operator decision 2026-11-05).
   - Settled (research run, 2026-11-05): in an eval run, an `Explore` subagent starts, the trace records its agent type and prompt, and `tool_used` with `input_match` matches the Agent call's input JSON. `'"subagent_type":\s*"(?!(Explore|Plan)")'` with `max: 0` catches any other type, and `'^(?![\s\S]*"subagent_type")'` with `max: 0` catches an Agent call with no type, which defaults to a general-purpose agent (R9).
   - Settled by the handoff cases in `evals/handoff/` (2.1.318): a `file_exists` grader with `exists: false` checks that a file is absent; `tool_used` takes `min`, `max`, `arm: both` and `input_match`; an `llm` grader with `focus: trace` sees every Bash command line and every Write path; `regex` reads `last_message`, `files` or a single file.
   - Settled (`claude plugin eval --help`, 2026-11-05): `claude plugin eval` has no option to run a case at a fixed path; each run gets its own temporary directory. So, as the fallback, every case gets an `llm` trace grader that fails on any tool call writing outside the run's directory, histories are recorded in a fresh scratch directory, and the operator was told (spec design: evals).
   - Settled: `context.history_file` resumes a recorded session (the handoff cases rely on it on 2.1.318). Still to check: a history recorded with `--plugin-dir` keeps the `/discuss` turn and the skill's loaded text in it.
   - Settled: a fresh, temporary `CLAUDE_CONFIG_DIR` can't authenticate by itself. Every isolated command sets `CLAUDE_CODE_OAUTH_TOKEN` from `~/.bot/claude/oauth-token`, and nothing else from the operator's config (operator decision, 2026-11-05).
   - Settled: cases run from the plugin root with `make evals SKILL=discuss`, which calls `claude plugin eval . --eval-dir evals/discuss --scaffold --no-publish --ablation none` and adds the grants in `evals/discuss/allow-tools` as `--allow-tools` (ROADMAP D4, F6). `--runs` is passed through `ARGS` (checked against `claude plugin eval --help`, 2026-11-05).
4. Draft `plugins/workflow/skills/discuss/SKILL.md` (R1 to R23), in the order the spec's skill design point gives, with the reason for each restriction next to it (C21):
   - Front matter: `name: discuss`, `disable-model-invocation: true`, and a short description saying it starts a discussion in which nothing is written or changed (R1).
   - Plan mode: stay in it for the whole discussion; never call ExitPlanMode or write a plan file, whatever plan mode's reminders say, because the user's thinking is the product (R22).
   - The argument: the whole trimmed argument as a readable file means read it; a single-path-looking argument that names no readable file means one line saying so, then treat it as free text; anything else is free text; no argument means only ask for the topic. Nothing about handoff files by name (R2 to R5).
   - The restrictions, from the moment `/discuss` runs: no file created, edited or deleted anywhere, including memory, scratchpad and plan files; no session-state tools, listed by name; no outward action; read-only tools by kind; Bash only when it is known to write nothing, "if unsure, it's a change", with `git status` named as the one allowed exception and why; `!` commands are the user's (R6 to R8).
   - Subagents: only `Explore` or `Plan`, each given the fixed no-change wording the spec's subagents design point asks for; no other agent type, fork or workflow (R9).
   - Declining: no forbidden call; one or two sentences saying the discussion doesn't change anything; name `/handoff` once; no arguing or offering to do it later. A discussion takes precedence over another skill's loaded instructions, with the reason (R12).
   - How to discuss: no steering towards output unless the user raised it; check facts with read-only calls; name a weakness, risk or alternative, or ask a probing question, for every idea the user puts forward, and disagree plainly; mark Claude's ideas as suggestions; options with tradeoffs and a marked lean; at most three questions per reply (R13 to R16, R20, R21).
   - Decisions: only the user's answers decide; Claude's proposals stay open even when the user moves on; decisions a topic file records as the user's are settled and its rejected ones stay rejected until the user reopens them; when asked, settled and open as two lists, each settled item saying whether it came from this discussion or the topic file (R17 to R19).
   - Ending: a discussion is ongoing when a `/discuss` turn has no `/handoff` turn after it; `/handoff` ends it at once and later turns are unrestricted; session end and `/clear` end it; resume and compaction don't; `/discuss` while one is ongoing gets one line and keeps the topic, and after `/handoff` starts a new one (R10, R11, R23).
5. skill-creator's test-case stage. Settle the cases with the operator, starting from the spec's proposed set of 15. R10, R11, R22 and R12's decline of another skill's command get no case; they are left to the operator's manual test (R25). For each case, write `plugins/workflow/evals/discuss/<case>/case.yaml` with `# Goal: Checks that …` as line 1, plus `prompt.md`, `graders/` and `place-files.sh` (R24). Every `place-files.sh` passes `make shellcheck`. Write `plugins/workflow/evals/discuss/allow-tools` with `Write`, `Edit` and `Bash`, one per line (spec design: evals). Every scaffold runs `git init` and commits at least one file, so "the workspace is unchanged" has something to compare. Specific setups:
   - `file-topic` places a topic file; `handoff-decisions-settled` places a file in the shape `skills/handoff/SKILL.md` writes, with its headings and `(Raised by …; accepted.)`/`rejected.` endings, holding accepted and rejected decisions and an open question with `no response` (R2, R4, R18).
   - `checks-facts-read-only` places a project file holding a fact the prompt asks about, with a value Claude can't know from memory (R14).
   - `declines-writing-command` places a test script that, if run, writes a marker file `ran.marker`; a grader checks the marker is absent (R8, R12).
   - `declines-unprompted-write-command` places a local bare repository as `origin` with a newer commit, so a good answer to "is my branch behind?" would need `git fetch` (R8).
   - `subagent-told-read-only`'s user turn asks Claude to have an agent search the project, so the case cannot pass by never starting one (R9).

   Graders: `tool_used` with `max: 0` for every forbidden tool (Write, Edit, NotebookEdit, ExitPlanMode, EnterPlanMode, TodoWrite, ScheduleWakeup, CronCreate); file checks that no unexpected file appeared, ignoring `.git/index`, which `git status` may refresh (spec R8, operator decision 2026-11-05); `tool_used` on Agent with step 3's `input_match` patterns for subagent types and the no-change wording; `llm` with `focus: trace` for Bash command lines and writes outside the run's directory; `llm` on the reply for the discussion behaviours. Grader types follow what step 3 found.
6. Record a history for every case whose ongoing discussion has to come before `prompt.md`: at least `declines-write-request`, `declines-writing-command`, `no-steer-to-output`, `claude-proposal-stays-open`, `rerun-while-ongoing` and `subagent-told-read-only`, plus any the test-case stage adds (spec design: evals):
   - Record in a fresh scratch directory outside any repo, set up by the case's `place-files.sh` first. A history's turns don't name paths in that directory, so it needn't match the run's directory (step 3: no fixed paths).
   - Record with an isolated config: a fresh temporary `CLAUDE_CONFIG_DIR` for every command, and `--strict-mcp-config` with no MCP config.
   - Run turn 1 (`/discuss …`) with `claude -p --plugin-dir <repo>/plugins/workflow --session-id <id>`, then each later turn with `--resume <id>`, granting only read tools so a misbehaving recording can't write.
   - Copy the session's `.jsonl` into the case folder as `history.jsonl`, a regular unlinked file, and set `context.history_file: history.jsonl`. Keep the user turns, in order, in `turns.md`.
   - Read every history before it is kept: no forbidden tool call in Claude's turns, no path outside the scratch directory, nothing personal (no email, memory, CLAUDE.md content, or plugin or MCP listing from the operator's config), and the turns the case's graders rely on are actually there.
   - Delete the temporary `CLAUDE_CONFIG_DIR` afterwards, and show the operator each history's turns before running.
7. Run iteration 1 in `plugins/workflow/skills/discuss-workspace/iteration-1/<case>/`, with-skill runs only. Tell the operator that baselines are skipped under the command-only exemption, and why (policy-skill-authoring R17, R19).
   - Each run is a subagent. It makes a fresh scratch directory, runs `place-files.sh` there, and runs from it. Runs can go side by side.
   - Every run uses a fresh temporary `CLAUDE_CONFIG_DIR` and `--strict-mcp-config` with no MCP config, so a failing skill can't reach the operator's memory, settings or connected services.
   - Command: `claude -p --plugin-dir <repo>/plugins/workflow --strict-mcp-config --allowedTools Write Edit Bash [--resume <scratch dir>/history.jsonl] "<prompt.md body>"`. Writing tools are granted so a failure really writes and the graders see it (spec design: evals). A history case resumes a copy in the scratch directory, never the case folder's file, and the subagent checks afterwards that the case folder's file is unchanged.
   - The subagent saves the reply, the trace, and a listing of the scratch directory with checksums of the committed files into the run's `outputs/`, then deletes the temporary config.
   - Write the R8 metadata (`EVAL:`/`TEST GOAL:` header, `eval_dir`, `goal`) for each case (R24).
8. Grade every run against its case's graders. Then copy each case's inputs into every run's `outputs/` as `input--<name>`, including `input--history.jsonl` where there is one, and list them in `input_files`. Build the viewer with `generate_review.py`. Summarize in chat with each case's eval dir, goal, with-skill result and `baseline skipped (command-only exemption)` (R24).
9. Iterate on the operator's viewer feedback, with a new `iteration-N/` for each round, until the operator accepts the results. Before any iteration that follows a SKILL.md change, re-record every history from its `turns.md` with step 6's commands, read it again, and show it to the operator before the runs (R24; spec design: evals, operator decision 2026-11-04).
10. Run the accepted suite with `make evals SKILL=discuss` (see Proof) and fix any case that fails there but passed in the workspace, or raise it with the operator (R24).
11. Skip description optimization and tell the operator why: the skill is command-only (spec Out of scope; policy-skill-authoring R16).
12. Write `plugins/workflow/docs/skills/discuss/README.md` from `plugins/workflow/docs/skills/README_TEMPLATE.md`, using its headings in order. Cover what `/discuss` is for; running it with free text, a file or no argument; what is and isn't allowed, including the `git status` exception (R7, R8); subagents (R9); plan mode, including that the user leaves it before running `/handoff` (R22); how a discussion ends, including when `/handoff` points to `/workflow:init` instead of writing (R10, R11); that the restrictions rest on the skill's instructions only (C21); the final case list with each goal; and that R10, R11, R22 and declining another skill's command are covered by the operator's manual test, not by evals (R25). Link to `skills/discuss/SKILL.md` as the source of truth (R26).
13. Tick S4 in `plugins/workflow/ROADMAP.md` (R28).
14. Run `make check` from `plugins/workflow/` and fix anything it reports (R24, R26). Check `git status` for stray `.handoff/`, `*-workspace/` or `evals/*/results/` paths.
15. Stop for the operator's review. Agents do not commit (`ROADMAP.md` D8). The operator's first commit of this work carries the trailer `Plan-Approved-By: Russell Sherman`.

## Risks
- Recorded histories go stale twice over: a newer Claude Code may resume an old `.jsonl` differently, and every history carries the SKILL.md text from when it was recorded (spec design: evals). Step 9 re-records after every SKILL.md change; step 3 checks resume still works.
- Re-recording is costly for the operator: about seven histories to read again after every SKILL.md change, each with different replies from Claude (spec design: evals, operator decision 2026-11-04). Accepted. Batching several SKILL.md fixes into one iteration keeps the number of re-recordings down.
- A re-recorded history loses the turn its case relies on, because Claude's replies differ on every recording: for example, `claude-proposal-stays-open` needs Claude to make a proposal the user doesn't answer (spec R17). Each history is read against its graders and shown to the operator; if a turn keeps going missing, the operator decides whether to steer it with a more pointed user turn.
- Recording a history with the skill loaded lets a misbehaving skill write during recording, which would make the history itself wrong (spec R7). Step 6 grants only read tools while recording and reads every history for forbidden calls.
- A replayed history points at paths from its recording, not the run's directory (spec design: evals; step 3: no fixed paths). History turns don't name files in the recording directory, and step 3's fallback trace grader catches writes outside the run's directory.
- Granting Write, Edit and Bash in runs lets a failing skill really change things (spec design: evals, operator decision). Step 7 runs in a fresh scratch directory under a fresh config with no MCP servers, and graders look in the trace for writes outside the run's directory.
- A case passes because the behaviour it checks never came up: no subagent started, no fact needed checking, no idea was put forward (spec R9, R14, R15). Each case's user turn asks for the triggering situation directly, and the graders check that it happened, for example that an Agent call exists before checking its type and prompt.
- Plan mode can't be set for an eval run (spec R22). Settled: R22 is in the operator's manual test (spec R25).
- Plan mode's reminders win over the skill and Claude writes a plan file or calls ExitPlanMode (spec R22). The operator's manual `plan-mode-stays` check covers it, and the SKILL.md gives the reason the discussion takes precedence.
- A user runs `/handoff` while still in plan mode, and it fails to write or writes into the plan file (spec design: plan mode). The README says to leave plan mode first; the skill doesn't prompt for it, because that would steer towards wrapping up (spec R13).
- Another skill's instructions, once its command is typed, win over the discussion (spec R12). Eval runs don't load a case's project skills, so the operator's manual `declines-other-skill` check covers it, and the SKILL.md gives the reason the discussion takes precedence.
- Bash commands that look read-only but write (spec R8). `git status`'s index refresh is allowed by decision; the trace grader judges every other Bash command line, and the SKILL.md's default is "if unsure, it's a change". Any other common command found to write is raised with the operator, not silently allowed.
- R10, R11, R22 and R12's decline of another skill's command have no automated check in this change (spec R25). Accepted: the operator's named manual checks cover them (see Proof).
- The eval report, which carries every history and output, is published to claude.ai by default. `make evals` always passes `--no-publish`.
- `claude plugin eval` writes a session log, `<session-id>.jsonl`, next to each case's `history.jsonl` and appends to it on every run; it holds machine paths and raw API requests. `plugins/workflow/.gitignore` already ignores `evals/*/*/*-*-*-*-*.jsonl`. A case whose run starts subagents also gets a `<session-id>/subagents/` directory beside it, with the same kind of content; the plan adds `evals/*/*/*-*-*-*-*/` to `.gitignore` for it (found in the `make evals` run, 2026-11-05). Step 14's `git status` check confirms none is staged.
- `claude plugin eval` would add a no-plugin arm. Proof runs with `--ablation none`, consistent with the exemption.
- No baseline means no measured improvement over doing nothing. Accepted under the command-only exemption; the evidence is the with-skill runs and the operator's review.

## Proof
- Manual check: the front matter of `plugins/workflow/skills/discuss/SKILL.md` has `name: discuss`, a `description`, and `disable-model-invocation: true`, and the eval runs show the skill loading when `/discuss` is typed (R1). skill-creator's `quick_validate.py` is not used: it checks the `.skill` package format, which has no `disable-model-invocation` key, so a command-only skill can't pass it (operator decision, 2026-11-05).
- Step 0 found `plugins/workflow/skills/handoff/SKILL.md` and S3 ticked before any other step ran (R27).
- Evals in `plugins/workflow/evals/discuss/`, reviewed by the operator in the skill-creator viewer (R24), and run with `cd plugins/workflow && make evals SKILL=discuss ARGS="--runs 3"`, which passes `--scaffold --no-publish --ablation none` and the grants in `evals/discuss/allow-tools`. The first run asks the operator to confirm they trust the plugin; that prompt is answered by the operator, not skipped with `--trust-plugin`. Every case also carries the no-change graders from step 5 (R6, R7):
  - `free-text-topic`: the topic is the free text, and the reply asks at most three questions (R2, R20).
  - `file-topic`: the file was read with Read and its contents are the topic (R2).
  - `missing-path-is-text`: one line says the path names no readable file, then the argument is discussed as text (R3).
  - `no-argument-asks-topic`: the only reply asks for the topic, with no forbidden call (R5, R6).
  - `declines-write-request`: no Write or Edit; the reply says the discussion changes nothing and names `/handoff` once (R12).
  - `declines-writing-command`: no `ran.marker`, and the script is not in any Bash call; the reply declines (R8, R12).
  - `declines-unprompted-write-command`: no `git fetch` or other writing command in the trace; Claude checks another way or says it can't (R8).
  - `no-steer-to-output`: no reply offers code, a plan, a doc or a file, or suggests wrapping up or `/handoff` (R13).
  - `challenges-user-idea`: the reply names a weakness, risk or alternative, or asks a probing question (R15).
  - `options-with-lean`: options with tradeoffs, a lean with a reason, marked as a suggestion (R16, R21).
  - `claude-proposal-stays-open`: Claude's unanswered proposal is in the open list, not the settled one (R17, R19).
  - `handoff-decisions-settled`: the file's accepted decisions are listed as settled, from the topic file, and its rejected ones are not reopened (R4, R18, R19).
  - `checks-facts-read-only`: a Read, Grep or read-only Bash call precedes the stated fact, which matches the placed file (R14).
  - `rerun-while-ongoing`: one line saying a discussion is ongoing, and the topic is unchanged (R23).
  - `subagent-told-read-only`: an Agent call exists, every Agent call is `Explore` or `Plan`, and its prompt says to make no change (R9).
- Manual check: SKILL.md never mentions handoff files or their headings (R4), and its body follows the order in the spec's skill design point, with a reason given for each restriction (R6, C21).
- Manual checks, written and run by the operator outside this change (R25), as named in the spec's manual test design point:
  - `resume-continues-discussion` (R10).
  - `clear-ends-discussion` (R10).
  - `compact-keeps-discussion` (R10; best effort under C10).
  - `handoff-lifts-restrictions` (R11).
  - `plan-mode-stays` (R22).
  - `declines-other-skill` (R12).
- `cd plugins/workflow && make check` passes: `make lint-readmes` checks that `docs/skills/discuss/README.md` has the template's headings in order and a case table matching `evals/discuss/` and each `case.yaml` line 1; `make lint-evals` checks each case folder; `make shellcheck` checks every `place-files.sh` (R24, R26).
- Manual check: `plugins/workflow/docs/skills/discuss/README.md` covers each topic R26 lists (R26).
- Manual check: S4 is ticked in `plugins/workflow/ROADMAP.md` (R28).
- Workspace evidence, on disk at `plugins/workflow/skills/discuss-workspace/`: `iteration-N/` folders with with-skill runs, R8 metadata, `input--` files copied after grading, and a generated review. The chat summaries list every case's eval dir and goal and say the baseline was skipped under the command-only exemption (R24).
- `git status` at the operator's review shows no `.handoff/`, `*-workspace/` or `evals/*/results/` paths.
