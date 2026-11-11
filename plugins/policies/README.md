# policies

Organizational policy skills: the rules your designs and code must follow, such as testing, security or data handling. Each policy is a `policy-*` skill, written so an agent can tell when it applies, follow its rules, and show that the work complies.

> **Status: empty.** The plugin is set up, but no policies are published yet. Add them as described below.

## Install

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install policies@ae-skills
```

## Using the policies

Policy skills are model-invocable: Claude loads one when the work in front of it falls in the policy's scope, such as adding an endpoint or storing personal data. You can also call one directly, for example `/policies:policy-testing`.

The [`blueprint`](../blueprint/) plugin builds on them: its `/lld` skill applies every `policy-*` skill that bears on a component's design, and lists the ones it applied in the spec's `policies:` front matter.

## Writing a policy

1. Copy [templates/policy-skill.md](templates/policy-skill.md) to `skills/policy-<name>/SKILL.md`.
2. Fill in every section and keep the headings, so every policy reads the same way:
   1. **Scope**: what work the policy applies to, and what it does not
   2. **Rules**: numbered and testable, `MUST` for requirements and `SHOULD` for strong defaults
   3. **Rationale**: why the policy exists
   4. **Showing compliance**: what a design, spec, plan or proof must contain for each rule
   5. **Exceptions**: who can approve departing from a `MUST`, and where that is recorded
   6. **Owner**: who owns the policy and when it was last reviewed
3. Write the `description` so it names the work that triggers the policy; that is how an agent decides to load it.
4. Bump the version in `.claude-plugin/plugin.json` before publishing.

Rule numbers (`P1`, `P2`, ...) are permanent: withdraw a rule, never renumber it, so specs and reviews that cite a rule stay correct.

## Policies

| Skill | Scope |
| --- | --- |
| *None yet* | |
