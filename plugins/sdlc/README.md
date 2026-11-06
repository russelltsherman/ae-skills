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

## Status

The plugin is in Phase 0, its foundation. `init` is the first skill you can run; the stage skills (`intent`, `spec`, `plan`) are not released yet. See `ROADMAP.md` for the components, the order they are built in and the design decisions behind them.
