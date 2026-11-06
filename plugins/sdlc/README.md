# sdlc

A Claude Code plugin that implements Anthropic's AI-native software development lifecycle playbook for a solo developer. Each stage of the lifecycle gets a skill that writes or reads that stage's document, kept in the project repo under `.specs/`, so that following the playbook is the easiest way to work.

## Install

This repository (`ae-skills`) is a marketplace. Add it, then install the plugin:

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install sdlc@ae-skills
```

## Status

The plugin is in Phase 0, its foundation. No stage skills are released yet, so installing it adds nothing you can run. See `ROADMAP.md` for the components, the order they are built in and the design decisions behind them.
