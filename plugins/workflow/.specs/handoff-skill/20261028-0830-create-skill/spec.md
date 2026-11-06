---
agent: claude
operator: Russell Sherman
skills: policy-skill-authoring
---
# Spec: Create handoff skill

## Requirements
- R1. A skill exists at `skills/handoff/SKILL.md` with `name: handoff` and `disable-model-invocation: true`. It runs only when the user types `/handoff` (or `/workflow:handoff`); the model never starts it.
- R2. Any text after `/handoff` is a free-text focus. With a focus, the handoff covers only the parts of the session that bear on it. Without one, it covers the whole session.
- R3. Once R6's check has passed, there is something to hand off when the session (or, with a focus, the part of it that bears on the focus) holds at least one decision, open question, idea, dead end or constraint. When there is not, `/handoff` creates no file and replies in one line that there was nothing to hand off. When a focus was given, that line names it: `Nothing to hand off: nothing in this session bears on "<focus>".` (operator decision, 2026-11-04).
- R4. `/handoff` asks no confirmation question before writing the file.
- R5. The handoff directory is `<git root>/.handoff/` when the current directory is inside a git repository, and `<current directory>/.handoff/` otherwise, including when `git` is not installed. `/handoff` never creates this directory: R6 requires `.handoff/.gitignore` inside it.
- R6. After finding the handoff directory (R5) and before R3's check, `/handoff` checks whether `.handoff/.gitignore` exists there. Only existence is checked; a file with any content counts as present. When it is missing, `/handoff` creates no file and no directory and replies in one line telling the user to run `/workflow:init` and then `/handoff` again, even when there would be nothing to hand off. `/handoff` never creates or changes `.handoff/.gitignore` (operator decision, 2026-11-05).
- R7. The handoff file is named `<YYYYMMDD-HHMM>-<slug>.md`, with the timestamp taken from `date +%Y%m%d-%H%M` when the file is written.
- R8. The slug is lowercase kebab-case using only `a-z`, `0-9` and `-`, at most five words. It is taken from the focus when one is given, otherwise from the session's topic.
- R9. An existing file is never overwritten. If the name is taken, `-2` is added before `.md`; if that is taken too, `-3`, and so on.
- R10. The file starts with `# Handoff: <topic>`. Without a focus, `<topic>` is the session's topic; with one, it is the focus alone, so the title reveals nothing outside the focus (R19) (operator decision, 2026-11-04). The title is followed by exactly these sections, in this order, with these exact headings: `## Summary`, `## Decisions` (containing `### Accepted` and `### Rejected`), `## Open questions`, `## Dead ends and constraints`, `## References`, `## Left out`. Every heading is always present; a section with nothing to say holds `None.` The file has no other sections.
- R11. `## Summary` says in a few sentences what the session was about and where it ended up.
- R12. Every bullet under `## Decisions` and `## Open questions` says who raised the item (the user or Claude). A decision bullet has the form `- <item>. Reason: <reason>. (Raised by <user|Claude>; <accepted|rejected>.)`; a decision whose reason was never given says `Reason: not stated.` An open question has no `Reason:` and has the form `- <item>. (Raised by <user|Claude>; <accepted|rejected|no response>.)`. An item the user stated firmly counts as accepted unless the user later dropped it, which counts as rejected. An item the user put as a question or a tentative idea ("maybe…", "what if…") is an open question with `no response` unless the user later committed to it, which counts as accepted (operator decision, 2026-11-04). R15's declined-request bullets are the one exception to these forms (operator decision, 2026-11-04).
- R13. An item is listed under `### Accepted` only when the user accepted it. An idea from Claude that the user never responded to is listed under `## Open questions` with `no response`, never as a decision. An idea is kept for its bearing on the topic, whoever raised it.
- R14. An item that changed during the session is recorded in its final form, with the earlier form noted in a short `Was: …` clause when it matters. Superseded positions are not listed as separate decisions.
- R15. A request the user made that was declined or not carried out during the session is listed under `## Open questions` in the past-tense form `- The user asked to <request>. Declined: <why>. (Raised by user.)`, so that no bullet reads as an instruction (operator decision, 2026-11-04).
- R16. `## Dead ends and constraints` lists approaches that were tried or considered and did not work, and limits discovered along the way, each with how it was found.
- R17. `## References` lists the files, URLs and commands the session relied on, as paths or links, without their contents.
- R18. The file names no next step: no section, sentence or instruction addressed to whatever reads it next. No bullet is phrased as an imperative; a declined request is recorded in R15's past-tense form (operator decision, 2026-11-04).
- R19. No secret pasted into the session (key, token, password, private key, connection string with credentials, and the like) is written to the file, in whole or in part. Where one is left out, the text says `[secret omitted]`, and `## Left out` has a bullet saying what kind of secret was left out and where it appeared in the session, without its value. `## Left out` lists omitted secrets only: topics dropped because they fall outside the focus are not recorded there or anywhere else in the file (operator decision, 2026-11-04). It lists only secrets that would otherwise have appeared in the file; a secret pasted in a part of the session outside the focus is not mentioned (operator decision, 2026-11-04).
- R20. After writing the file, `/handoff` replies with the file's absolute path, tells the user to run `/clear` before passing the file to the next step, and may give one example of a likely next step that takes the path as its input. It then stops, making no further tool calls. It never says or implies that it cleared the session.
- R21. `/handoff` creates or modifies no file outside `.handoff/`. The only file it writes is the handoff file. It never deletes a file.
- R22. At runtime the skill uses only the harness's own tools and the `git` and `date` commands. It checks whether a file exists, both a candidate handoff file name and `.handoff/.gitignore`, with the Read tool on the exact path, not a shell test. The Glob tool is not used, because it is not in Claude Code's default tool set on macOS, Linux or WSL (operator decision, 2026-11-05). It depends on no other skill, plugin, script or service.
- R23. Documentation exists at `docs/skills/handoff/README.md` in the plugin directory, i.e. `plugins/workflow/docs/skills/handoff/README.md` from the repo root (operator decision, 2026-11-04; path changed to `docs/skills/<skill>/` under ROADMAP D9). It covers what `/handoff` is for, how to run it with and without a focus, where the file goes, the file's section headings (R10) so other skills can rely on them, that `/workflow:init` creates `.handoff/.gitignore` and what `/handoff` does when it is missing (R6), that cleaning up `.handoff/` is the user's job, and the skill's test cases, each with its goal. It links to `skills/handoff/SKILL.md` as the source of truth. It follows the skill README template, `docs/skills/README_TEMPLATE.md` in the plugin directory: its headings, their order and its rules.
- R24. The skill is built under policy-skill-authoring: skill-creator invoked first, its full workflow, test cases as case folders under `evals/handoff/` at the plugin root (operator decision, 2026-11-05; ROADMAP D4), each with a `# Goal: Checks that …` first line in `case.yaml`.
- R25. When the build is done, S3 is ticked in `ROADMAP.md` (operator decision, 2026-11-05).

## Design
- **The skill (R1, R2, R4, R22).** A single `SKILL.md` with no scripts. `disable-model-invocation: true` keeps the model from starting it. The body is written in the order the work happens: find the directory (R5); check for `.handoff/.gitignore` (R6); decide whether there is anything to hand off (R3); pick the name (R7 to R9); write the file (R10 to R19); reply and stop (R20). The `$ARGUMENTS` text is the focus.
- **Finding the directory (R5).** `git rev-parse --show-toplevel`; if it fails for any reason, the current directory is used. Note that inside this repo the git root is `ae-skills/`, not the plugin directory.
- **Gitignore without touching the project (R6, R21).** `/workflow:init` (ROADMAP S2) creates `.handoff/.gitignore`, which ignores everything in `.handoff/`, so the project's own `.gitignore` is never touched (C6). `/handoff` only checks that it exists. Stopping when it is missing means a handoff file never lands in a directory git would pick up (C1, C15). Checking existence, not content, respects a user's own file there. This relies on `init` creating the file in the directory R5 resolves (the git root, or the current directory outside a repo); `init`'s own spec has to match.
- **Naming (R7 to R9).** `date` gives the timestamp. Before writing, the skill reads `.handoff/<YYYYMMDD-HHMM>-<slug>.md` with the Read tool (`limit: 1`). If the file is there, it tries `-2.md`, then `-3.md` and so on, until a Read reports that the file does not exist (R22). The Write tool is only ever called on a path that did not exist.
- **The file format (R10 to R19).** Fixed headings so other skills can find sections by heading. Mapping from C8: decisions accepted and rejected with reasons → `## Decisions` / `### Accepted` / `### Rejected` (R12); open questions and declined requests → `## Open questions` (R13, R15); dead ends and constraints → `## Dead ends and constraints` (R16). `## Summary`, `## References` and `## Left out` are additions: a reader needs orientation, pointers back to source material, and a visible record of what was withheld (R19). Example of the shape:

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
  - Send a reminder the day before a hold expires? (Raised by Claude; no response.)
  - The user asked to write the spec now. Declined: the discussion was still open. (Raised by user.)

  ## Dead ends and constraints
  - The SMS gateway batches every 30 minutes; found while checking its docs.

  ## References
  - `services/holds/events.py`

  ## Left out
  - An SMS gateway API key, pasted while checking the gateway docs.
  ```
- **Weighting and attribution (R12 to R14).** The user's messages decide what counts as accepted or rejected; Claude's messages are a source of ideas, never of decisions. This is what lets the next step tell Claude's suggestions apart from the user's decisions, which the raw conversation does not.
- **Neutral file, helpful reply (R18, R20).** The file is neutral because `/handoff` can't know the next step. The chat reply may suggest one, e.g. `/discuss <path>`, because the user can ignore it.
- **Multi-turn cases (R24).** A case that needs a prior conversation keeps it as a recorded session in the case folder: `history.jsonl`, recorded from a real multi-turn session and copied in, named by `context.history_file: history.jsonl` in `case.yaml`, with `prompt.md` holding `/handoff [focus]` as the next turn. `claude plugin eval` resumes that session (`--resume <file>`) and sends the prompt, so `/handoff` runs on a real session, not a transcript pasted into the prompt. The history file must be a regular, unlinked file inside the case folder. No recorded history holds a real secret; `secret-omitted` uses a fake key. `nothing-to-hand-off` has no history file. Every case's scaffold places `.handoff/.gitignore` except `missing-gitignore-points-to-init` (R6). Verified 2026-11-04 against Claude Code 2.1.318: the case schema and runner code, plus a live resume-from-file test followed by a command-only skill as the next turn (operator decision, 2026-11-04).
- **No baseline runs (R24).** `/handoff` is command-only (R1), so under `policy-skill-authoring/20261027-0830-create-skill R17` no baseline runs are made in any iteration, by skill-creator or by `claude plugin eval`. A baseline would be a session in which `/handoff` is an unknown command, and `claude plugin eval` already runs `history_file` cases with the plugin only. The with-skill runs, graded and reviewed in the eval viewer, are the evidence, and the operator is told the baselines were skipped and why (R19 there) (operator decision, 2026-11-04).
- **Test cases (R24).** skill-creator's test-case step settles them with the operator. Proposed starting set:
  - `writes-full-handoff`: Checks that a file is written in `.handoff/` with a timestamped name and every fixed section in order, and that the reply gives the path and tells the user to run `/clear`.
  - `attributes-ideas`: Checks that each decision and open question says who raised it and whether the user accepted, rejected or did not respond.
  - `unanswered-suggestion-stays-open`: Checks that a suggestion from Claude the user never answered is under Open questions, not Accepted.
  - `records-final-position`: Checks that a decision changed mid-session is recorded in its final form only.
  - `declined-request-recorded`: Checks that a request declined during the session is under Open questions, marked as a declined request.
  - `secret-omitted`: Checks that a pasted API key appears nowhere in the file and Left out records its omission.
  - `nothing-to-hand-off`: Checks that no file is created besides the placed `.handoff/.gitignore` and the reply is one line.
  - `focus-matches-nothing`: Checks that no file is created when the focus matches nothing in the session, and the one-line reply names the focus.
  - `focus-sets-slug-and-scope`: Checks that the slug comes from the focus and a topic unrelated to the focus is left out.
  - `no-overwrite`: Checks that an existing file with the same name is unchanged and the new file gets a `-2` suffix. The setup places one file for the current minute. If the minute changes before the run writes its file, the case misses the collision; that rare flake is accepted and the case is rerun rather than guarded against (operator decision, 2026-11-04).
  - `gitignores-unchanged`: Checks that a handoff is written when `.handoff/.gitignore` holds something other than `*`, and that it and the project's `.gitignore` are unchanged.
  - `missing-gitignore-points-to-init`: Checks that with no `.handoff/.gitignore`, in a session with something to hand off, no file or directory is created and the one-line reply tells the user to run `/workflow:init` (operator decision, 2026-11-05). It resumes a history, so it shows `/handoff` stops even when a write was otherwise due (operator decision, 2026-11-05).
  - `outside-git-repo`: Checks that the handoff file is written to `.handoff/` in the current directory when it is not inside a git repository.
  - `file-names-no-next-step`: Checks that the file contains no instruction or suggestion addressed to a next step.

## Out of scope / Deferred
- Deleting or expiring old handoff files. C1 makes cleanup the user's job.
- Running `/clear` or starting the next step. The agent cannot run `/clear` (C2).
- Suggesting `/handoff` from other skills, or reading handoff files in them. Each is captured in that skill's own intent.
- Noting in the file that the session had already been compacted before `/handoff` ran. The intent does not ask for it, and it is hard to detect reliably. Deferred.
- skill-creator's description optimization (`scripts/run_loop.py`). `/handoff` is command-only (R1), and `policy-skill-authoring/20261027-0830-create-skill R16` exempts command-only skills from it (operator decision, 2026-11-04).
- Listing `/handoff` in the plugin's own `README.md`. The intent names only `docs/skills/handoff/README.md`.

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R6, R21. `.handoff/.gitignore`, created by `init`, ignores the directory's contents; `/handoff` writes nothing without it, and nothing deletes a handoff file. |
| C2 | R20. The reply tells the user to run `/clear` and stops. |
| C3 | R4. |
| C4 | R24, and the test cases design point. |
| C5 | R22. `git` is used only to find the root, and its absence falls back to the current directory (R5). |
| C6 | R6, R21. |
| C7 | R1. |
| C8 | R10, R12, R15, R16, and the file format design point. |
| C9 | R19. |
| C10 | R2, R8. |
| C11 | R5. |
| C12 | R8, R9. |
| C13 | R3. |
| C14 | R23. |
| C15 | R6, and the gitignore design point. |

## Open questions from the intent
None.

## Areas of concern
None.
