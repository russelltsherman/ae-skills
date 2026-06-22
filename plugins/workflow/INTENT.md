# Intent: workflow, a Claude Code plugin of general session skills

Author: Russell Sherman.

This is the root intent for the `workflow` plugin. Every change below it is planned in `.specs/`, following the naming rule and templates in `.specs/_rules/`. The work breakdown (foundation, check-target, eval-target, skills, design decisions and phases) is in [`ROADMAP.md`](ROADMAP.md).

## Problem

How I work with Claude in a session is the same in every project: thinking a topic through without being pushed to output, handing a session's results on to a fresh one, and building skills the same way each time. Doing this by habit alone is unreliable. Claude drifts towards writing code or plans, compaction drops who decided what, and a skill can be written without a method or evals.

Nothing captures these habits today, so they have to be repeated by hand in every project and every session, and nothing checks that they were followed.

## Proposed outcome

A Claude Code plugin, `workflow`, published in the `ae-skills` marketplace, holding skills for how I work with Claude in any project or session, plus repo-wide policies. It is separate from `sdlc`, which holds only the playbook's stage skills; neither plugin requires the other.

- I can start a discussion in which my thinking is the product and nothing is written or changed until it ends.
- I can hand a session's results (decisions, open questions, dead ends, references) on to a fresh session.
- Every skill in this repo is built the same way: under a policy that requires a method, test cases with stated goals, and reviewable eval results.
- A minimal `init` prepares a project for the skills that write files into it.
- One command, `make check`, verifies the plugin without any model calls.
- A separate command, `make evals`, runs the skills' eval cases, either for every skill or for one.
- Every skill has eval cases that can be run and a README, and the plugin README is accurate.

## Affected users and systems

- **Now:** one solo developer (the author), across every project they open in Claude Code.
- **Later:** other Claude Code users who install the plugin.
- **Systems:** Claude Code (plugins and marketplaces, skills, `claude plugin validate`, `claude plugin eval`), skill-creator, Git.

## Constraints

1. **Skill naming.** Skills the user invokes directly are one lowercase word. Where a name matches a built-in (such as `/init`), the skill is invoked by its qualified name, `/workflow:<name>`. Policy skills are not covered by this rule.
2. **Skills are built under policy.** Every skill is created or changed under the `policy-skill-authoring` policy skill, so that policy is built first.
3. **Minimal toolchain.** Scripts are Bash and `jq`, with Python stdlib only where Bash gets unreadable. Shipped skills need nothing outside the plugin at run time.
4. **Plugin and project stay separate.** Shipped files are referenced through `${CLAUDE_PLUGIN_ROOT}`. A project file is created only by `init` or by the skill that owns it.
5. **workflow owns its planning rules.** `.specs/_rules/` here is workflow's own copy and may diverge from sdlc's.
6. **Dogfooding.** Until sdlc's stage skills are released, changes are planned by hand under `.specs/_rules/`. Once each one is released (`intent`, `spec`, `plan`), workflow changes use it.
7. **Evals stay out of `make check`.** Evals are real, billed model runs, so they have their own target and `make check` stays free.
8. **`init` owns `.handoff/.gitignore`.** `init` creates it. `handoff` never creates it; when it is missing, `handoff` directs the user to `init`.
9. **Opting in to sdlc.** When sdlc's opt-in marker is implemented, workflow runs sdlc's `init` and takes its opt-in marker.

## Open questions

None.
