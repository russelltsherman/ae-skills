---
agent: claude
operator: Russell Sherman
skills: workflow:policy-skill-authoring
---
# Spec: create the spec skill

## Requirements
- R1. The plugin has a skill at `skills/spec/SKILL.md` with `disable-model-invocation: true`. The operator runs it as `/sdlc:spec`, and Claude never starts it on its own. It takes an optional argument naming the change directory in one of the forms `.specs/_rules/naming.md` gives under "Finding a change directory", or none.
- R2. At run time the skill reads `naming.md` and `spec_template.md` from `${CLAUDE_PROJECT_DIR}/.specs/_rules/` and follows them. It reads `intent_template.md` from there only before it first edits `intent.md` under R12, and follows it for that edit (operator decision, 2026-11-06). `SKILL.md` points to those files and does not restate their rules: it carries no front-matter key table, section list, ID-numbering rule or concern-settling rule of its own.
- R3. If `${CLAUDE_PROJECT_DIR}/.specs/_rules/`, `naming.md` or `spec_template.md` is missing, the skill writes nothing and tells the operator to run `/sdlc:init`. If `intent_template.md` is missing when the skill is about to edit `intent.md` under R12, it writes nothing, neither the intent edit nor `spec.md`, and tells the operator to run `/sdlc:init` (operator decision, 2026-11-06).
- R4. The skill finds the change directory as `naming.md` says. When more than one directory matches, it lists them and asks the operator which one is meant. When none matches, it writes nothing and says so.
- R5. Before any alignment, the skill checks the change directory in this order, and if a check fails it writes nothing and says which check failed:
  1. it has an `intent.md`;
  2. the intent's `operator` is set, not empty and not `pending` (operator decision, 2026-11-06);
  3. the intent does not say `spec: skipped`; if it does, the skill points the operator to `/sdlc:plan`;
  4. it has no `spec.md`; if it has one, the skill says reworking a spec is not supported yet.
- R6. Running `/sdlc:spec` on a change directory that passes R5 is the operator's request for the spec, and so approves the intent, as the spec template says.
- R7. Before writing, the skill reads the intent critically. As needed, it reads the project (code, docs, `ROADMAP.md`-style plans, and the change directories the intent cites) to test what the intent says. It looks for gaps, constraints that contradict each other, constraints that cannot be checked, outcome text that no constraint backs, and design questions the intent leaves open. It asks the operator about them, a few at a time, until they are aligned, and only then writes `spec.md`.
- R8. The skill finds policy skills as D10 says: every skill in the session whose name, after any plugin namespace, starts with `policy-`, whether it comes from the project, the user or a plugin. For each one whose description covers the change, it invokes the skill through the Skill tool before writing requirements, and applies its rules to the requirements and the design. A description alone never counts as applying a skill. When alignment changes the intent, the skill matches the descriptions again against the changed intent and invokes and applies any policy skill that now covers the change before writing `spec.md`, raising anything it brings up with the operator under R7 (operator decision, 2026-11-06).
- R9. The spec's `skills:` key lists every policy skill applied under R8, comma-separated, each written as the session names it, with its plugin namespace when it has one (e.g. `workflow:policy-skill-authoring`), or `none` when none applies (operator decision, 2026-11-06).
- R10. When two applied policy skills, or a policy skill and the intent, cannot both be satisfied, the skill raises the conflict with the operator during alignment, with a proposed option. If the operator decides it, the decision is written where it belongs under R11 and R12, and no concern is listed. If not, the skill writes the conflict as a concern in `## Areas of concern` with the proposed option. The skill never resolves a conflict itself (operator decision, 2026-11-06).
- R11. The skill records as decided only what the operator decided during the run, marked as the spec template says. An answer the skill proposes stays an open question or a concern. An open question from the intent that the operator does not answer is carried forward as a concern.
- R12. When the operator's answer changes the intent (a new, changed or withdrawn constraint, or an answered open question), the skill edits `intent.md` in the same run, following the intent template's rules for changing an intent. When it withdraws a constraint, it also removes text elsewhere in the intent that states the same behaviour. It runs no git and does not check whether the intent is committed.
- R13. The spec's `operator` value is the user's name from the session context. If the session does not have it, the skill asks. It never runs `git` to find it (operator decision, 2026-11-06). The intent's `operator` may name someone else; the skill then uses the session's name and does not ask about the difference (operator decision, 2026-11-06).
- R14. The skill writes only `spec.md` and, under R12, `intent.md`, both in the chosen change directory. It never creates `plan.md`, edits no other file, runs no git command and never commits.
- R15. When it has written `spec.md`, the skill tells the operator its path, lists every change it made to `intent.md`, lists the concerns left in `## Areas of concern`, says that asking for the plan approves the spec once no concern remains, and stops.
- R16. The skill ships in the plugin and needs nothing outside the harness at run time: no other plugin, no skill-creator, no script outside `${CLAUDE_PLUGIN_ROOT}`.
- R17. The skill is built under `policy-skill-authoring`, with eval cases in `evals/spec/<case>/` at the plugin root. Because it is command-only, its eval runs have no baseline and its description is not optimized. It is built and tested with `--plugin-dir` and used on real work only from a released version.
- R18. Withdrawn: it recorded a probe and its result, not behaviour that can be tested; the result and the manual-check decision are in the Evals design point (operator decision, 2026-11-06). Was: Before the plan relies on evals for R8 to R10, the work probes whether a case's scaffold can install a user-level `policy-*` skill that an eval run loads. If it can, eval cases cover R8 to R10. If it cannot, the plan lists a manual check, run with `claude --plugin-dir .` and fixture policy skills, for each of R8, R9 and R10 (operator decision, 2026-11-06). The probe ran on 2026-11-06 (Claude Code 2.1.319): a skill written to `~/.claude/skills/` is not loaded, and one written to the run's private config directory is, but that location is undocumented, so R8 to R10 are proven by manual checks (operator decision, 2026-11-06).

## Design
- **Skill (`skills/spec/SKILL.md`)** (R1, R2, R16). Front matter: `name: spec`, a `description` saying it turns an approved `intent.md` into `spec.md`, and `disable-model-invocation: true`. No `allowed-tools` rule: the skill uses Read, Write, Edit, Glob, Grep and the Skill tool, and the operator approves writes as usual. The body is a short procedure that names the rule files and says what to do, in this order:
  1. **Rules** (R2, R3): read `${CLAUDE_PROJECT_DIR}/.specs/_rules/naming.md` and `spec_template.md`; stop with the `/sdlc:init` message if any is missing.
  2. **Find** (R4): resolve the argument, or its absence, by `naming.md`'s "Finding a change directory". With no argument, `naming.md` picks the most recent change directory that has an `intent.md`, even one that already has a `spec.md`; the skill then stops at R5 check 4, and the operator names the change they mean. This is accepted as is (operator decision, 2026-11-06).
  3. **Check** (R5, R6): the four checks, in order.
  4. **Policy** (R8): list the session's `policy-*` skills, invoke those whose description covers the change, and keep their rules in view for the next steps.
  5. **Align** (R2, R3, R7, R10, R11, R12, R13): read the intent and the project, raise gaps, contradictions and design questions, and policy conflicts, with the operator; write each answer where it belongs (intent edits now, spec content in step 6). Before the first intent edit, read `intent_template.md`, or stop with the `/sdlc:init` message if it is missing. If the intent changed, repeat step 4 for the changed intent, and align on anything a newly applied policy skill raises (R8).
  6. **Write** (R9, R10, R11, R14): write `spec.md` by `spec_template.md`, with unanswered items and undecided conflicts as concerns.
  7. **Report and stop** (R15).
- **What the skill adds beyond the template** (R7, R8, R12). The template says what a spec contains; the skill adds the behaviour around it: when to stop, how to challenge the intent, how to find and load policy skills, and when to edit the intent. Anything that is a rule about the document itself stays in the template (R2).
- **Evals (`evals/spec/`)** (R17). Each case scaffolds a project with `.specs/_rules/` copied from the plugin at run time (the scaffold script runs from the case folder, so the plugin root is `$(dirname "$0")/../../..`) and a change directory to work on. Eval runs are non-interactive and have no AskUserQuestion tool, and all text after `/sdlc:spec` reaches the skill as its argument, which R1 reserves for the change directory. So a case cannot give the operator's answers: it checks that the skill stops, to ask (an intent with contradicting constraints) or at a check. Cases cover: a missing `.specs/_rules/`; an existing `spec.md` (R5 check 4); and an intent with contradicting constraints. There is no clean-intent case: in the first eval iteration a small, fully specified intent still drew design questions under R7, so a run that writes `spec.md` without the operator's answers cannot be relied on, and R2, R6, R9 (`none`), R13, R14 and R15 on the write path are proven by a manual check instead (operator decision, 2026-11-06). The other R5 checks, a single missing rule file (R3), and no matching, two matching and no-argument change directories (R4) are proven by manual checks, not eval cases (operator decision, 2026-11-06). File content is graded with `regex` graders whose `target` is `{ source: file, path }`, and the report with `llm` graders on `focus: last_message`. "Wrote nothing", "no git" and "no `spec.md`" are graded with `tool_used` graders that set both `min: 0` and `max: 0` (`min` defaults to 1), or `file_exists` with `exists: false`, since a trace-focused `llm` grader sees only the ends of a trace. Behaviour that needs the operator's answers (R10, R11, R12, R8's recheck) and the policy behaviour (R8 to R10) is proven by manual checks. A probe on 2026-11-06 (Claude Code 2.1.319) found that a skill a scaffold writes to `~/.claude/skills/` is not loaded in an eval run, and one written to the run's private config directory is, but that location is undocumented, so policy behaviour is not tested with evals (operator decision, 2026-11-06).
- **Policy scope** (R17). `policy-skill-authoring` applies to `SKILL.md` and the cases in `evals/spec/`. The skill has no script, so all of the work happens inside skill-creator's workflow.

## Out of scope / Deferred
- Deferred: reworking an existing `spec.md`, including settling its concerns in a later run (intent C15).
- Claude starting the skill on its own. It is command-only (intent C1; C14 withdrawn).
- Checking whether `intent.md` is committed, or telling the operator how to commit an intent change (intent C17 withdrawn, C19).
- Linting `spec.md` from inside the skill. `make check`, and later hooks, run `scripts/lint-specs.sh` (operator decision, 2026-11-06).
- Applying a policy skill that cannot be invoked through the Skill tool. A policy skill must be model-invocable to be applied. A command-only policy skill (`disable-model-invocation: true`) is not shown to the model, so the skill cannot find it or name it (operator decision, 2026-11-06).
- Reading operator answers or other text from the argument. The argument only names the change directory (R1) (operator decision, 2026-11-06).
- Finding policy skills that are not in the session, such as files in `.claude/skills/` that Claude Code did not load (D10).
- Deferred: the spec template says the skills in `skills:` have "the versions in the repo at the commit that adds this spec", which does not hold for a plugin policy skill such as `workflow:policy-skill-authoring`. Fixing that wording is a `specs-rules` change; this skill lists names only (operator decision, 2026-11-06).

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. |
| C2 | R5 (check 2), R6. |
| C3 | R4. |
| C4 | R2, R3. |
| C5 | R7. |
| C6 | R8, R9. |
| C7 | R10. |
| C8 | R11. |
| C9 | R14, R15. |
| C10 | R3. |
| C11 | R16. |
| C12 | R17. |
| C13 | R17. |
| C14 | Withdrawn. |
| C15 | R5 (check 4). Rework is under Out of scope / Deferred. |
| C16 | R5 (check 3). |
| C17 | Withdrawn. |
| C18 | R8. |
| C19 | R12. |

## Open questions from the intent
None.

## Areas of concern
None.
