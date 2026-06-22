# Skill README template

Every skill README in `docs/skills/<dir>/README.md` follows this template. A README is written for a person deciding whether and how to use the skill; the skill's `SKILL.md` is written for the agent and is the source of truth. A README explains, it does not restate the SKILL.md as instructions.

## Rules

- **Lead with what it does and when to use it.** These two sections come first, right after the title line, and must make sense on their own: a reader who stops after them should know what the skill does and whether this is the moment to use it.
- **Fixed headings, fixed order.** Use the `##` headings below, in this order, with these exact names. Omit an optional section only when it has nothing to say; never rename or reorder. Add skill-specific `###` subsections only under **Details**.
- **Present tense, plain statements.** Describe what the skill does ("`/handoff` writes…"), not what the agent is told to do ("Write…").
- **No contradiction with SKILL.md.** If the README and SKILL.md disagree, SKILL.md wins and the README is fixed. Leave out agent-side mechanics (which tool checks what, prompt wording) unless a person needs them.
- **Test cases match the repo.** The case list is the folders in `evals/<skill>/`, and each goal is copied word for word from line 1 of the case's `case.yaml`, without the `# Goal: ` prefix.
- **Write it last.** Write or update the README after the skill's eval results are accepted, so it describes what is committed.

## Template

Copy everything below the line. Replace `<…>` placeholders and delete the guidance in *italics*.

---

```markdown
# <skill-name>

<One sentence: what the skill is, in plain words.> Source of truth: [`skills/<skill>/SKILL.md`](../../../skills/<skill>/SKILL.md).

## What it does

*Two to five sentences, then bullets if needed. Say what the skill produces or changes, and the problem it solves: what goes wrong without it. A reader should be able to stop here and know what they get.*

## When to use it

*The moments the skill is for, as a short bullet list. Then a "Not for" list naming nearby situations it does not cover, pointing to what to use instead where there is something.*

- <situation>
- <situation>

Not for:

- <near-miss situation>

*How it starts. Use one of:*
- *Command-only (`disable-model-invocation: true`): "It runs only when you type `/<skill>` (or `/<plugin>:<skill>`); the model never starts it."*
- *Model-invoked: "The model starts it on its own when <trigger from the description>. You can also ask for it by name."*

## How to use it

*Invocation and arguments, with one or two examples in code blocks. What the skill asks you, if anything, and what it replies with when it finishes. For a model-invoked skill with no command, say what to ask for or what triggers it, with an example request.*

## Details

*Optional. The behaviour a user relies on, as `###` subsections specific to the skill: files it writes and where, output formats other skills depend on, rules it applies, exemptions. Give the reason for a rule when it isn't obvious.*

## Limits

*Optional. What the skill deliberately does not do, what is left to the user, and what is out of its control. One bullet each.*

## Test cases

The skill's test cases live in [`evals/<skill>/`](../../../evals/<skill>/). Each goal is the first line of the case's `case.yaml`.

*One sentence on how the evals run, if it differs from the default (for example, no baseline runs for a command-only skill).*

| Case | Goal |
| :---- | :---- |
| `<case>` | <goal> |
```
