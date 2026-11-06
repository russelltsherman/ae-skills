# policy-skill-authoring

The policy for how agent skills are created and changed: every skill is built with skill-creator and its full eval loop, every test case states its goal, and eval results are labelled so a reviewer can tell what each test checks. Source of truth: [`skills/policy-skill-authoring/SKILL.md`](../../../skills/policy-skill-authoring/SKILL.md).

## What it does

`policy-skill-authoring` is a policy skill: it changes nothing itself, but sets the rules an agent follows whenever it builds or changes a skill. Without it, a skill can be written without a consistent method or without evaluations. Test cases can also end up where `claude plugin eval` and `make check` never see them, and reviewers can't tell what a test was meant to check.

- Every skill change goes through Anthropic's skill-creator skill and its whole workflow, from capturing intent to iterating on the operator's review in the eval viewer.
- Test cases live as case folders at the plugin root, each with a one-sentence goal on line 1 of its `case.yaml`.
- Eval runs are labelled with their case path and goal, and input files are shown beside the outputs, so a reviewer always knows what each test checks and what it was given.

## When to use it

- Creating a new skill.
- Changing any `SKILL.md`, however small, including its description or front matter.
- Adding or changing a skill's test cases or graders.
- Writing an intent, spec or plan for any of the above.

Not for:

- Using a skill, or running its existing evals with `make evals`.
- Writing or updating a skill's README in `docs/skills/`. A README is not a skill change and needs no eval loop.
- Changes to hooks, commands, scripts or plugin manifests that don't touch a skill.

The model starts it on its own when it is about to create or change a skill, or write an intent, spec or plan for that work. You can also ask for it by name. In practice it rarely starts on its own (see Limits), so name it when you start skill work, and list it in the spec's `skills:` key.

## How to use it

Ask for the skill work as usual, and point the agent at the policy:

```
> Following policy-skill-authoring, add a skill that writes a PR description from the branch's commits.
```

The agent first invokes skill-creator, then works through its stages, stopping for your review in the eval viewer after each iteration. Results reported in chat list each case by its eval directory and goal:

```
`evals/weekly-report/flags-negative-quantity`: Checks that the summary states the total revenue and flags the negative row. With skill 3/3, baseline 1/3
```

When writing a spec for skill work, list `policy-skill-authoring` in its `skills:` key; the plan's steps then follow the rules below.

## Details

### Owner and conflicts

The human operator owns the policy, and only the owner changes it. When the policy conflicts with an intent, another policy skill or skill-creator's own instructions, the agent does not resolve it. It raises the conflict with the operator: as an area of concern while a spec is being written, otherwise in chat before going on.

### The rules, in the order the work happens

1. **skill-creator first.** Before any other step, the agent invokes skill-creator through the Skill tool. Reading its files does not count. If skill-creator isn't installed, the agent changes nothing, tells you to install it, and stops.
2. **The whole workflow.** Capture intent, research, draft, write test prompts, run with-skill and baseline runs, review in the viewer built by skill-creator's `generate_review.py`, and iterate until you accept. If subagents or the viewer are unavailable, the agent stops rather than falling back to a reduced mode.
3. **Case folders at the plugin root.** Test cases go in `evals/<skill>/<case>/` at the root of the plugin that ships the skill, not inside the skill's folder. That way `claude plugin eval --eval-dir evals/<skill>` can run them and `make check` lints them. skill-creator's older `evals/evals.json` is not used.
4. **A goal for every case.** Line 1 of each `case.yaml` is `# Goal: Checks that …`: one sentence listing the behaviours the case checks and nothing else, written when the case is created.
5. **Labelled runs.** Each iteration's `eval_metadata.json` starts its prompt with `EVAL: evals/<skill>/<case>` and `TEST GOAL: <goal>`, and has `eval_dir` and `goal` fields. The viewer shows only the prompt field, so this is how the reviewer sees where each case lives and what it checks.
6. **Inputs after grading.** A case's input files are copied into each run's outputs as `input--<name>` only after every run is graded, so the viewer shows them formatted like the outputs and graders never mistake them for something the run produced.
7. **Reports name the case.** Chat summaries list each case with its eval directory and goal.
8. **Description optimization.** When a skill is created or its description changes, the agent runs skill-creator's `scripts/run_loop.py`.

If a later skill-creator shows the eval directory, goal or input files itself, the agent raises that with the owner instead of keeping rules 5 and 6 out of habit.

### Exemptions

- **Typo fixes.** An edit that only fixes spelling, punctuation or formatting may skip the loop, as long as it changes no meaning, no part of the description and no test case. The commit message says it was made under the typo exemption.
- **Command-only skills skip baselines.** A skill with `disable-model-invocation: true` runs no baseline runs: the model never starts it, so a run without it is a session where its command is unknown, and its score says nothing. Every other stage still runs, and the agent tells you it skipped baselines and why. Skipping baselines is not reduced mode: the viewer must still be built.
- **Command-only skills skip description optimization**, since there is no triggering to optimize.

Removing `disable-model-invocation: true` ends both command-only exemptions. It counts as a description change, so it runs optimization, and that change and every later one run baselines. There is no other waiver, and no waiver for a single task; to change that, the owner changes the policy.

## Limits

- It is advisory. Nothing such as a hook or a pull request check makes a session follow it.
- It rarely starts on its own. In description optimization, no wording made it trigger reliably for one-shot requests (about 6% recall, with no false triggers), so name it or list it in a spec when you start skill work.
- It does not cover writing READMEs, which follow [`README_TEMPLATE.md`](../README_TEMPLATE.md).

## Test cases

The skill's test cases live in [`evals/policy-skill-authoring/`](../../../evals/policy-skill-authoring/). Each goal is the first line of the case's `case.yaml`.

The evidence for this skill is skill-creator's loop and its viewer, with baselines, rather than `make evals`. Each case gives the agent a small test plugin in its `files/` folder.

| Case | Goal |
| :---- | :---- |
| `command-only-skips-baseline` | Checks that, for a change to a command-only skill, no baseline runs are planned or started and the operator is told why. |
| `command-only-skips-description-optimization` | Checks that description optimization is not listed as required for a new command-only skill, and that the reply says it is skipped because the skill is command-only. |
| `dropping-command-only-flag-runs-optimization` | Checks that removing `disable-model-invocation: true` from a skill is treated as a description change that requires description optimization. |
| `model-invoked-skill-runs-baseline` | Checks that, for a change to a skill without `disable-model-invocation: true`, baseline runs are still planned alongside the with-skill runs. |
| `new-skill-invokes-skill-creator` | Checks that skill-creator is invoked through the Skill tool before any `SKILL.md` is written. |
| `test-case-carries-goal` | Checks that each new case's `case.yaml` opens with a `# Goal: Checks that …` comment, inside a case folder with `prompt.md` and `graders/`, and that no `evals.json` is written. |
| `typo-fix-skips-loop` | Checks that the fix is made without starting the eval loop and the commit message cites the typo exemption. |
| `wording-change-runs-loop` | Checks that skill-creator is invoked for a one-sentence change to a skill's guidance. |
