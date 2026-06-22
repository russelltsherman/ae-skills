# workflow

Skills for driving my personal workflow in Claude Code.

## Skills

### `/greet` — the "hello world" of agent skills

The smallest useful skill: run the command and the agent says hello. Use it to check that the
plugin is installed and that its skills load and run.

```
> /greet
Hello!
```

- **Command-only.** `disable-model-invocation: true` means Claude never starts it on its own.
  It runs only when you type `/greet` (or `/workflow:greet`).
- **No tools, no side effects.** It replies and stops. Any text after the command
  (`/greet the whole team please`) is ignored.

The entire skill is one file, [`skills/greet/SKILL.md`](skills/greet/SKILL.md):

```markdown
---
name: greet
description: "Hello world skill: replies with a simple greeting. Invoked only by the /greet command."
disable-model-invocation: true
---

# Greet

Reply with exactly:

Hello!

Do not call any tools or add anything else. This skill is a minimal "hello world" for verifying that plugin skills load and run.
```

#### Evals

The skill ships with test cases in [`skills/greet/evals/`](skills/greet/evals/), in the layout
`claude plugin eval` reads:

| Case | Prompt | Checks |
|---|---|---|
| `greets-on-command` | `/greet` | says hello · one short line · no tool calls |
| `greets-ignoring-arguments` | `/greet the whole team please` | the above · no extra work from the arguments |

First benchmark (one run per configuration):

| | With skill | Without skill |
|---|---|---|
| Pass rate | 100% | 58% |
| Time | 7.0s | 8.7s |

Without the skill, the agent improvises: it says `/greet` isn't installed, asks follow-up
questions, or offers to post the greeting to Slack. With the skill, it just says `Hello!`.

To run the evals yourself (real, billed model runs):

```bash
cd plugins/workflow/skills/greet
claude plugin eval . --allow-tools Write,Edit,Bash
```

## Layout

```
workflow/
├── .claude-plugin/plugin.json
└── skills/
    └── greet/
        ├── SKILL.md
        └── evals/
            ├── greets-on-command/
            └── greets-ignoring-arguments/
```

## Install

This repository (`ae-skills`) is a marketplace. Add it, then install the plugin:

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install workflow@ae-skills
```

Then try it:

```
/greet
```
