---
agent: claude
operator: Russell Sherman
skills: none
---
# Spec: Skill authoring policy

## Requirements
- R1. A skill exists at `skills/policy-skill-authoring/SKILL.md` with `name: policy-skill-authoring`. Its description makes it trigger when an agent creates or changes an agent skill in this repo, or writes a spec or plan for such a change.
- R2. The SKILL.md says the policy is owned by the human operator, without naming a person, because the skill ships in a plugin used by other operators (operator decision, 2026-11-04). It says that when this policy conflicts with an intent, another policy skill or skill-creator's own instructions, the agent does not resolve the conflict. It raises it with the operator: as an area of concern when a spec is being written, otherwise in chat before going on.
- R3. Before any other step of creating or changing a skill, the agent invokes the skill-creator skill through its Skill tool. Reading skill-creator's `SKILL.md` or other files instead does not count.
- R4. If no skill-creator skill is available to invoke, the agent makes no change to the skill, tells the operator that skill-creator is not installed and must be installed, and stops.
- R5. The agent completes every stage of skill-creator's workflow: capture intent, research, draft the SKILL.md, write test prompts, run with-skill and baseline runs, review the results in the eval viewer built by skill-creator's `eval-viewer/generate_review.py`, and iterate on the operator's feedback. The agent does not skip a stage on its own judgement. Only R11 allows the loop to be skipped, and only R17 allows one of its stages (baseline runs) to be skipped.
- R6. Test cases use the case-folder format that `claude plugin eval` reads (`evals/<skill>/<case>/` at the root of the plugin that ships the skill, with `prompt.md`, `case.yaml`, `graders/` and, when needed, `files/`), so `claude plugin eval --eval-dir evals/<skill>` can run them (operator decision, 2026-11-05). skill-creator's `evals/evals.json` is an older mechanism and is not used to define test cases; skill-creator's run, grading and viewer steps take each case's prompt, input files and graders from its case folder (operator decision, 2026-11-04).
- R7. Each test case's goal is written when the case is created. It is one sentence starting "Checks that …" that lists the behaviours checked and nothing else. It is stored as the first line of the case's `case.yaml`, as the comment `# Goal: Checks that …`.
- R8. In every iteration, each test case's `eval_metadata.json` has a `prompt` field that starts with the line `EVAL: evals/<skill>/<case>`, then the line `TEST GOAL: <goal>`, then a blank line, then the test prompt. The file also has an `eval_dir` field (`evals/<skill>/<case>`) and a `goal` field. The eval directory is the case's path from the plugin root (operator decision, 2026-11-05).
- R9. When the agent summarizes eval results in chat, it lists each test case with its eval directory and its goal.
- R10. For each test case with input files, once every run in the iteration is graded and before the viewer is launched, the agent copies each file in the case's `files/` folder into every run's `outputs/` folder as `input--<name>`, and lists the names in an `input_files` field of the case's `eval_metadata.json`. Inputs are never copied before grading.
- R11. An edit that only fixes spelling, punctuation or formatting may skip the skill-creator loop, provided it changes no meaning, no part of the `description`, and no test case. The commit message says the edit was made under the typo exemption. Every other change goes through R3 to R10. Apart from the exemptions in R16 and R17, which apply to every skill that meets them, the policy has no other waiver, and a waiver for a single task is not allowed; to change this rule, the owner changes the policy (operator decision, 2026-11-04).
- R12. This policy skill is itself built under R3 to R10, R14 and R15.
- R13. Withdrawn: C12 is withdrawn, because neither memory file exists in any agent memory directory, so there is nothing to delete (operator decision, 2026-11-04). Was: In the change that adds the skill, `memory/feedback_skill_creator.md` and `memory/feedback_eval_test_goals.md` are deleted, and so is the line for `feedback_skill_creator.md` in `MEMORY.md`. (`feedback_eval_test_goals.md` has no line there.)
- R14. When a skill is created, or its `description` changes, the agent also runs skill-creator's description optimization step (`scripts/run_loop.py`). For any other change the step is optional (operator decision, 2026-11-04).
- R15. If subagents or the eval viewer are unavailable, so that skill-creator would fall back to its reduced mode without baseline runs or the viewer, the agent does not continue in that mode. It stops and notifies the operator (operator decision, 2026-11-04).
- R16. R14 does not apply to a command-only skill, one whose front matter has `disable-model-invocation: true`: the model never triggers it, so there is no triggering to optimize, and the agent skips the description optimization step. A change that removes `disable-model-invocation: true` from a skill counts as a change to its `description` under R14 (operator decision, 2026-11-04).
- R17. A command-only skill, one whose front matter has `disable-model-invocation: true`, is exempt from baseline runs: the agent runs no baseline (no-skill or old-skill) runs for it in any iteration. Every other stage of R5 still runs: with-skill runs, grading, review in the eval viewer and iteration on the operator's feedback. The flag alone decides: the agent applies the exemption without asking the operator first (operator decision, 2026-11-04).
- R18. A skill without `disable-model-invocation: true` is not exempt and runs baselines, whatever its test cases look like. A change that removes the flag runs baselines, and so does every later change (operator decision, 2026-11-04).
- R19. When the agent skips baseline runs under R17, it tells the operator that it skipped them and why: the model never starts a command-only skill, so a run without it is a session where its command is unknown, and its score says nothing about the skill.
- R20. When the agent summarizes the results of a skill exempt under R17, each case line (R9) gives the with-skill result and says the baseline was skipped under the exemption, for example: `evals/standup/lists-yesterday-today`: Checks that the standup lists yesterday's and today's work as two short bullet lists. With skill 3/3, baseline skipped (command-only exemption).
- R21. Skipping baselines under R17 is not reduced mode (R15): subagents still run the with-skill runs and the eval viewer is still built, and if either is unavailable the agent stops and tells the operator.
- R22. Documentation exists at `docs/skills/policy-skill-authoring/README.md` in the plugin directory, i.e. `plugins/workflow/docs/skills/policy-skill-authoring/README.md` from the repo root. It covers what the policy is for and when it applies (R1), who owns it and how conflicts are raised (R2), how to apply it when writing a spec or plan, the rules in the order the work happens (R3 to R10, R14, R15), the typo exemption and the two command-only exemptions with their limits (R11, R16 to R21), that there is no other waiver (R11), and the skill's test cases in `evals/policy-skill-authoring/`, each with its goal. It links to `skills/policy-skill-authoring/SKILL.md` as the source of truth. It follows the skill README template, `docs/skills/README_TEMPLATE.md` in the plugin directory: its headings, their order and its rules.
- R23. Withdrawn: the skill is built from scratch with its cases in `evals/policy-skill-authoring/` from the start, so there is nothing to move (operator decision, 2026-11-05). Was: This skill's own test cases live in `evals/policy-skill-authoring/` (R6). Moving them there from `skills/policy-skill-authoring/evals/` and amending the policy for C16 is a change to the skill under R3 to R10: it runs the full skill-creator loop with baseline runs (R18). The `description` does not change, so description optimization is optional (R14) (operator decision, 2026-11-05).

## Design
- **The skill (R1, R2).** A single `SKILL.md` with no scripts. The description names both triggers: building or changing a skill, and specifying or planning that work. The skill can then be applied when a spec is written, and listed in the spec's `skills:` key. The body says the operator owns the policy and how conflicts are raised to them (R2). It then gives the rules in the order the work happens: invoke skill-creator, or stop if it is missing (R3, R4); follow the whole workflow, or stop if it cannot run in full (R5, R15), with command-only skills skipping only baseline runs (R17 to R21); write test cases (R6, R7); prepare each iteration's metadata (R8); copy inputs after grading (R10); report results (R9); optimize the description, except for command-only skills (R14, R16); the typo exemption (R11).
- **Why each workaround exists.** R8 and R10 exist because skill-creator's viewer shows only the `prompt` field of `eval_metadata.json`, and formats only the files in a run's `outputs/` folder. The SKILL.md gives that reason next to each rule. If a later version of skill-creator shows these things itself, the agent can tell the rule no longer applies and raises it with the owner (R2) instead of keeping a workaround that is no longer needed.
- **The goal in `case.yaml` (R7).** It is a YAML comment, not a key, so `case.yaml` keeps the exact schema that `claude plugin eval` reads. R8 copies the goal from `case.yaml` into each iteration's metadata, so the goal is written once and reused.
- **Referring to skill-creator by name (R3, R4).** The policy names skill-creator as a skill, never as a file path. It accepts any installed skill named `skill-creator`, including plugin-namespaced ones such as `anthropic-skills:skill-creator`. The policy only uses skill-creator while skills are being built, so nothing in this repo needs it at runtime.
- **Building this skill (R12).** The skill is built from scratch with skill-creator, since the policy it would otherwise be built under does not exist yet (workflow `ROADMAP.md` Phase 1). Drafts kept outside the repo may be read for reference, but none is copied in (operator decision, 2026-11-05). Its test cases are settled as these eight, each goal being line 1 of the case's `case.yaml` (operator decision, 2026-11-05):
  - `new-skill-invokes-skill-creator`: Checks that skill-creator is invoked through the Skill tool before any `SKILL.md` is written. (R3)
  - `typo-fix-skips-loop`: Checks that the fix is made without starting the eval loop and the commit message cites the typo exemption. (R11)
  - `wording-change-runs-loop`: Checks that skill-creator is invoked for a one-sentence change to a skill's guidance. (R3, R11)
  - `test-case-carries-goal`: Checks that each new case's `case.yaml` opens with a `# Goal: Checks that …` comment, inside a case folder with `prompt.md` and `graders/`, and that no `evals.json` is written. (R6, R7)
  - `command-only-skips-baseline`: Checks that, for a change to a command-only skill, no baseline runs are planned or started and the operator is told why. (R17, R19)
  - `command-only-skips-description-optimization`: Checks that description optimization is not listed as required for a new command-only skill, and that the reply says it is skipped because the skill is command-only. (R16)
  - `dropping-command-only-flag-runs-optimization`: Checks that removing `disable-model-invocation: true` from a skill is treated as a description change that requires description optimization. (R16)
  - `model-invoked-skill-runs-baseline`: Checks that, for a change to a skill without `disable-model-invocation: true`, baseline runs are still planned alongside the with-skill runs. (R18)

  R4 has no case, because skill-creator is a synced account skill that an eval run cannot exclude (operator decision, 2026-11-04). Removing the flag under R18 and the reduced-mode wording under R21 have no case either (operator decision, 2026-11-04); they are checked by reading the SKILL.md.
- **The baseline exemption (R17 to R21).** It sits in the policy's workflow rule, after the stage list and before the reduced-mode rule, beside the description-optimization exemption it mirrors: the same front matter test, the same duty to tell the operator why, and the same end when the flag is removed. The reduced-mode rule is worded so that a missing viewer always stops the agent, while a missing baseline is allowed only under the exemption (R21). skill-creator's viewer and benchmark steps handle iterations that have only with-skill run folders.
- **Where cases live (R6, R8).** skill-creator would put cases in an `evals/` folder inside the skill's own folder; the policy tells the agent not to. Cases sit in `evals/<skill>/<case>/` at the plugin root, where `make check` lints them and where `claude plugin eval --eval-dir evals/<skill>` finds them and writes its results to `evals/<skill>/results/` (ignored as `evals/*/results/`). The labels give the same path, `evals/<skill>/<case>`, so a reviewer can go from the viewer straight to the case folder or the run command. The policy says "the root of the plugin that ships the skill" rather than naming this plugin, so it also holds for skills in other plugins built under it.
- **Eval workspaces (R5, R12).** Workspaces are created in `skills/<skill-name>-workspace/`, beside the skill, where skill-creator places them. Their internal layout is skill-creator's (operator decision, 2026-11-04). Workspaces are gitignored (`skills/*-workspace/`) and never committed, which is the usual practice for skill-creator workspaces. (operator decision, 2026-11-04).
- **The README (R22).** Built from the skill README template, `docs/skills/README_TEMPLATE.md`. Written for a person, not an agent: it explains the policy rather than restating SKILL.md as instructions, and points to `skills/policy-skill-authoring/SKILL.md` as the source of truth. It is written after the operator accepts the eval results and the description is final, so its rule summary and case list match what is committed. A README is not a SKILL.md or a test case, so writing or changing it is not a skill change under this policy and needs no eval loop.

## Out of scope / Deferred
- Exempting a skill the model can start on its own, even when its cases cannot have a meaningful baseline. Excluded by C13 (operator decision, 2026-11-04).
- Enforcement. Nothing deterministic, such as a hook or a pull request check, makes a session follow the policy; the skill is advisory (operator decision, 2026-11-04).
- Listing the policy in the plugin's own `README.md`. The intent names only the docs README (C15).
- Running this skill's cases with `make evals` and giving it an `evals/policy-skill-authoring/allow-tools` file. The skill-creator loop and its viewer are the evidence for this build (operator decision, 2026-11-05).

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. The skill is written to `skills/policy-skill-authoring/`. |
| C2 | R3, R4. The policy refers to skill-creator by name and uses it only while skills are built, so nothing needs it at runtime. |
| C3 | R5, R6, R8, and the eval workspaces design point. skill-creator's process, workspace files and locations are kept, and R8 only adds fields. Test cases are defined in case folders, which replace skill-creator's older `evals/evals.json` (operator decision, 2026-11-04). |
| C4 | R3, R5, R14, R15. Baseline runs are qualified by C13, and description optimization by C17. |
| C5 | R7. |
| C6 | R8 for the review page, R9 for chat. Both give the case's path from the plugin root. |
| C7 | R10. |
| C8 | R11. |
| C9 | R2. |
| C10 | R3, R12. |
| C11 | R4. |
| C12 | Withdrawn. |
| C13 | R17, R18, R21. Only baseline runs are skipped, and only for command-only skills. |
| C14 | R11, R17. The exemption is a rule in the policy, not a waiver. |
| C15 | R22. |
| C16 | R6, R8, and the "where cases live" design point. |
| C17 | R16. |

## Open questions from the intent
None.

## Areas of concern
None.
