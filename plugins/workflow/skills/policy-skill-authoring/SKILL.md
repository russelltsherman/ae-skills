---
name: policy-skill-authoring
description: "Policy for creating or changing an agent skill in this repo: always build it with the skill-creator skill and its full eval loop, write each test case with a stated goal, and make eval results reviewable. Use this whenever you are about to create a new skill, edit any SKILL.md or a skill's test cases, or write an intent, spec or plan for such a change, even if the edit looks small or the user didn't mention skill-creator or evals."
---

# Skill authoring policy

This policy says how agent skills are created and changed. It applies to every new skill, every change to a `SKILL.md`, and every change to a skill's test cases. It also applies while an intent, spec or plan for such a change is being written: list `policy-skill-authoring` in the spec's `skills:` key and make the plan's steps follow the rules below.

## Owner and conflicts

The human operator owns this policy. Only the owner changes it.

If this policy conflicts with an intent, another policy skill, or skill-creator's own instructions, do not resolve the conflict yourself, even when one side looks obviously right. Raise it with the operator:

- while a spec is being written, as an entry in its `## Areas of concern`;
- otherwise, in chat, before going on with the work.

A rule that no longer matches how skill-creator behaves (see the reasons given beside the review rules below) is such a conflict.

## The rules, in the order the work happens

### 1. Invoke skill-creator first

Before any other step of creating or changing a skill, invoke the skill-creator skill through the Skill tool. Any installed skill named `skill-creator` counts, including a plugin-namespaced one such as `anthropic-skills:skill-creator`.

Reading skill-creator's `SKILL.md` or its other files does not count. Invoking it loads its whole workflow into the session, and that workflow is what the rest of this policy builds on.

If no skill-creator skill is available to invoke, change nothing. Tell the operator that skill-creator is not installed and must be installed, and stop.

### 2. Run the whole workflow

Complete every stage of skill-creator's workflow: capture intent, research, draft the `SKILL.md`, write test prompts, run with-skill and baseline runs, review the results in the eval viewer built by skill-creator's `eval-viewer/generate_review.py`, and iterate on the operator's feedback until they accept the results.

Do not skip a stage on your own judgement. Two exemptions exist, and nothing else allows a skip: the command-only baseline exemption below, which skips one stage, and the typo exemption (rule 9), which skips the whole loop.

**Command-only skills skip baseline runs.** A command-only skill is one whose front matter has `disable-model-invocation: true`. For such a skill, run no baseline (no-skill or old-skill) runs in any iteration. Everything else still runs: with-skill runs, grading, the eval viewer and iteration on feedback. The flag alone decides; apply the exemption without asking first. When you skip baselines, tell the operator that you did and why: the model never starts a command-only skill, so a run without it is a session where its command is unknown, and its score says nothing about the skill.

A skill without the flag runs baselines, whatever its test cases look like. A change that removes the flag runs baselines, and so does every change after it.

**No reduced mode.** If subagents or the eval viewer are unavailable, so that skill-creator would fall back to a mode without baseline runs or the viewer, do not continue. Stop and tell the operator. Skipping baselines under the command-only exemption is not reduced mode: subagents still run the with-skill runs and the viewer is still built, and if either is unavailable you stop.

### 3. Write test cases as case folders at the plugin root

Write each test case as a folder at `evals/<skill>/<case>/` **at the root of the plugin that ships the skill**, not inside the skill's own folder. Each folder holds `prompt.md`, `case.yaml`, `graders/` and, when the test needs input files, `files/` with a `place-files.sh` scaffold script named under `context:` in `case.yaml`. Use the formats in skill-creator's `references/schemas.md`.

skill-creator's default puts cases in an `evals/` folder inside the skill directory. Don't follow that default here: `claude plugin eval --eval-dir evals/<skill>` runs cases only from the plugin-root location, and the plugin's own checks lint them there. Do not write `evals/evals.json`; it is an older format and is not used to define test cases. skill-creator's run, grading and viewer steps take each case's prompt, input files and graders from its folder.

### 4. Give every case a goal when you create it

Line 1 of each `case.yaml` is the case's goal, written when the case is created:

```yaml
# Goal: Checks that the summary states the total revenue and flags the negative row.
schema_version: "1.1"
name: flags-negative-quantity
```

The goal is one sentence starting "Checks that …" that lists the behaviours the case checks and nothing else. It is a YAML comment, not a key, so `case.yaml` keeps the exact schema `claude plugin eval` reads. Without it, a reviewer looking at results cannot tell what a test was trying to validate.

### 5. Label every run for review

In every iteration, write each case's `eval_metadata.json` with:

- `prompt`: the line `EVAL: evals/<skill>/<case>`, then the line `TEST GOAL: <goal>`, then a blank line, then the test prompt;
- `eval_dir`: `evals/<skill>/<case>`, the case's path from the plugin root;
- `goal`: the goal from line 1 of `case.yaml`, without `# Goal: `.

Use the case name as the case's directory name in the workspace.

```json
{
  "eval_name": "flags-negative-quantity",
  "eval_dir": "evals/weekly-report/flags-negative-quantity",
  "goal": "Checks that the summary states the total revenue and flags the negative row.",
  "prompt": "EVAL: evals/weekly-report/flags-negative-quantity\nTEST GOAL: Checks that the summary states the total revenue and flags the negative row.\n\n<the test prompt>",
  "assertions": []
}
```

*Why:* skill-creator's viewer shows only the `prompt` field of `eval_metadata.json`, so the header is the only way the reviewer sees where the case lives and what it checks. If a later skill-creator shows the eval directory and goal on its own, raise that with the owner instead of keeping the header out of habit.

### 6. Show input files only after grading

For each case with input files, once every run in the iteration is graded and before the viewer is built, copy each file in the case's `files/` folder into every run's `outputs/` folder as `input--<name>`, and list those names in an `input_files` field of the case's `eval_metadata.json`. Never copy them before grading, or a grader may take an input for something the run produced.

*Why:* the viewer formats only the files in a run's `outputs/` folder, so this is the only way the reviewer sees the inputs formatted like the outputs. If a later skill-creator shows input files on its own, raise that with the owner.

### 7. Report each case with its eval directory and goal

Whenever you summarize eval results in chat, list every case with its eval directory and its goal, then its results:

```
`evals/weekly-report/flags-negative-quantity`: Checks that the summary states the total revenue and flags the negative row. With skill 3/3, baseline 1/3
```

For a command-only skill, give the with-skill result and say the baseline was skipped:

```
`evals/standup/lists-yesterday-today`: Checks that the standup lists yesterday's and today's work as two short bullet lists. With skill 3/3, baseline skipped (command-only exemption)
```

### 8. Optimize the description

When a skill is created, or its `description` changes, run skill-creator's description optimization step (`scripts/run_loop.py`). For any other change it is optional.

A command-only skill (`disable-model-invocation: true`) skips this step, because the model never starts it, so there is no triggering to optimize. Say so when you skip it. A change that removes `disable-model-invocation: true` counts as a change to the description, so it runs optimization.

### 9. The typo exemption

An edit that only fixes spelling, punctuation or formatting may skip the skill-creator loop, provided it changes no meaning, no part of the `description`, and no test case. The commit message says the edit was made under the typo exemption.

Every other change goes through rules 1 to 8. Apart from the two command-only exemptions, which apply to every skill that meets them, this policy has no waiver, and a waiver for a single task is not allowed, even if someone asks for one in the moment. To change this, the owner changes the policy.
