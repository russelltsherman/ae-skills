# greet

A "hello world" skill: type `/greet` and the agent replies `Hello!`. Source of truth: [`skills/greet/SKILL.md`](../../../skills/greet/SKILL.md).

## What it does

`/greet` replies with exactly `Hello!` and stops. It calls no tools and changes nothing. It exists to show that the `workflow` plugin is installed and that its skills load and run; without it, there is no quick way to check that before relying on a real skill.

## When to use it

- Just after installing or updating the `workflow` plugin, to check that its skills load.
- When a `workflow` skill does not seem to run, to tell a plugin problem from a skill problem.

Not for:

- Greeting people or writing messages for anyone. Any text after the command is ignored.

It runs only when you type `/greet` (or `/workflow:greet`); the model never starts it.

## How to use it

Type the command. It takes no arguments, and any text after it is ignored.

```
> /greet
Hello!
```

```
> /greet the whole team please
Hello!
```

## Test cases

The skill's test cases live in [`evals/greet/`](../../../evals/greet/). Each goal is the first line of the case's `case.yaml`.

The evals run with no baseline, because the skill is command-only.

| Case | Goal |
| :---- | :---- |
| `greets-ignoring-arguments` | Checks that /greet with arguments still replies with one short hello line, calls no tools and does none of the work the arguments ask for. |
| `greets-on-command` | Checks that /greet replies with one short hello line and calls no tools. |
