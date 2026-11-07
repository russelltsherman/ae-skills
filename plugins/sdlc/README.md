# sdlc

A Claude Code plugin that implements Anthropic's AI-native software development lifecycle playbook for a solo developer. Each stage of the lifecycle gets a skill that writes or reads that stage's document, kept in the project repo under `.specs/`, so that following the playbook is the easiest way to work.

## Install

This repository (`ae-skills`) is a marketplace. Add it, then install the plugin:

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install sdlc@ae-skills
```

## Usage

In a Claude Code session started in your project's directory, run:

```
/sdlc:init
```

It sets up the project for `sdlc`:

- the planning rules, copied into `.specs/_rules/`;
- the opt-in marker `.claude/sdlc.md`, which records the plugin version and is meant to be committed;
- a short pointer section in `.claude/CLAUDE.md`, between `<!-- sdlc:begin -->` and `<!-- sdlc:end -->`.

It creates only what is missing, never overwrites a file, and commits nothing. It reports each path as created, updated or skipped; review the changes and commit them yourself.

To start a change, run `/sdlc:intent` with what you want:

```
/sdlc:intent Add due dates to tasks
```

It questions the request against the project, naming gaps and contradictions and asking about scope, users, constraints and success, until you are aligned. Then it writes one new `.specs/<feature>/<YYYYMMDD-HHMM>-<change>/intent.md` and gives you its path. Review it; it applies your corrections in the same session. It writes nothing else and commits nothing.

When you have reviewed an intent, run `/sdlc:spec` to turn it into a spec, optionally naming the change directory:

```
/sdlc:spec due-date-feature/create
```

It reads the intent critically against the project and asks you about gaps, contradictions and open questions until you are aligned, writing your answers that change the intent back into `intent.md`. It applies the session's `policy-*` skills, raising any conflict between them with you. Then it writes `spec.md` beside the intent, and tells you its path, what it changed in the intent and which concerns are left for you to decide. It never writes the plan and commits nothing.

When the spec has no concerns left (or the intent says `spec: skipped`), run `/sdlc:plan` to plan the change, optionally naming the change directory:

```
/sdlc:plan due-date-feature/create
```

It reads the intent, the spec and the code, and asks you about gaps, conflicts and risks before writing anything, a few questions at a time. Your decisions that change the intent or the spec are written back into them. It checks every command in the plan's Proof against the real tool without running a build or a billed run. Then it writes `plan.md`, or reworks the one already there, and gives you its path and the documents it changed. It never enters or exits built-in plan mode, edits no code, starts no implementation and commits nothing.

## Status

The plugin is in Phase 0, its foundation. `init` is the first skill you can run; the stage skills (`intent`, `spec`, `plan`) are not released yet. `plan` can be built and tried from this repo with `claude --plugin-dir .`, but is not released yet. See `ROADMAP.md` for the components, the order they are built in and the design decisions behind them.
