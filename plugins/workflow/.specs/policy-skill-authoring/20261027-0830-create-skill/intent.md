---
agent: claude
operator: Russell Sherman
origin: person
type: feature
risk: elevated
spec: required
---
# Intent: Skill authoring policy

## Problem
Specs are expected to be written under the organization's policies, expressed as skills, and this repo has none. The work right now is creating agent skills, and nothing records how that must be done, so a skill could be written without a consistent method or without evaluations.

What has been learned about creating skills so far lives only in agent memory: `memory/feedback_skill_creator.md` (always engage skill-creator and its eval loop) and `memory/feedback_eval_test_goals.md` (what eval results must show for review). Memory is not a policy that a spec can apply. On 2026-10-30, when a skill's evals were reviewed, it wasn't clear what each test was trying to validate, because the review page showed only the prompt, outputs and grades.

Some skills cannot have a meaningful baseline. A command-only skill runs only when someone types its command, so its test cases send that command. A baseline run is a session in which the command is unknown, so its score says nothing about the skill. Requiring baselines for such a skill means running baselines whose results mean nothing, or building it against the policy.

skill-creator puts a skill's test cases in an `evals/` folder inside the skill's own folder, but `claude plugin eval --eval-dir` will not run cases from there. This plugin keeps eval cases in `evals/<skill>/<case>/` at the plugin root (workflow `ROADMAP.md` D4, operator decision, 2026-11-05), and its `make check` lints them there. Unless the policy says so, an agent following skill-creator writes cases where they cannot be run or checked, and review labels name the wrong path.

## Proposed outcome
This repo has its first policy skill, covering how agent skills are created and changed. Whenever we create or change an agent skill, we use Anthropic's skill-creator and generate evaluations as skill-creator prescribes. When eval results are reviewed, it is clear where each test lives, what it checks, and what it was given as input. For a command-only skill, the with-skill runs and their review in the eval viewer are the evidence, without baseline runs.

## Affected users and systems
- Anyone creating agent skills in this repo.
- Every skill created or changed in this project from now on.
- Systems: the policy skill in `skills/policy-skill-authoring/` with its evals in `evals/policy-skill-authoring/`, and its documentation at `plugins/workflow/docs/skills/policy-skill-authoring/README.md` from the repo root.

## Constraints
- C1. The policy is an agent skill written to `skills/` in this repo.
- C2. skill-creator lives outside the repo. This is allowed because it is used only to build skills, not at runtime.
- C3. Evaluations follow skill-creator's format and process.
- C4. skill-creator is engaged as a skill and its full workflow is followed: capture intent, research, draft the SKILL.md, write test prompts, run with-skill and baseline runs, review results in the eval viewer, and iterate on feedback. Reading skill-creator's SKILL.md as a reference does not count.
- C5. Every test case carries a goal note, written when the case is created: one sentence starting "Checks that …" that lists the checked behaviours and nothing else.
- C6. Every test case shown for review shows its goal and its eval directory, as its path from the plugin root (e.g. `evals/weekly-report/flags-negative-quantity`). Each test's goal is also given when results are summarized in chat (operator decision, 2026-11-05).
- C7. When a test has input files, their full content is shown for review, formatted the same way as output documents, and added only after grading so graders never mistake an input for something the run produced.
- C8. Small typo fixes can bypass the full eval loop.
- C9. The human operator owns the policy; concerns raised under it go to them.
- C10. Claude always uses the skill-creator skill whenever it creates a skill.
- C11. If the skill-creator skill is not installed, the agent stops and tells the user to install it.
- C12. Withdrawn: neither memory file exists in any agent memory directory, so there is nothing to remove (operator decision, 2026-11-04). Was: Once the policy exists, `memory/feedback_skill_creator.md` and `memory/feedback_eval_test_goals.md` are removed.
- C13. A command-only skill, one whose front matter has `disable-model-invocation: true`, is exempt from baseline runs. Only baseline runs are exempted: with-skill runs, grading, review in the eval viewer and iteration on the operator's feedback still run. A skill the model can start on its own still runs baselines.
- C14. The baseline exemption is part of the policy and applies to every skill that meets it. It is not a waiver for one task.
- C15. The policy is documented in a `README.md` at `plugins/workflow/docs/skills/policy-skill-authoring/` from the repo root, following the skill README template at `plugins/workflow/docs/skills/README_TEMPLATE.md`.
- C16. A skill's test cases live in `evals/<skill>/<case>/` at the root of the plugin that ships the skill, so `claude plugin eval --eval-dir evals/<skill>` can run them (operator decision, 2026-11-05).
- C17. A command-only skill, one whose front matter has `disable-model-invocation: true`, is exempt from description optimization, since the model never starts it. Removing the flag counts as a change to the skill's description (operator decision, 2026-11-05).

## Open questions
None.

## Action already taken
None.
