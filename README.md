# ae-skills

Russell Sherman's Claude Code plugin marketplace — plugins for agentic engineering workflows.

## Plugins

- **`workflow`** — skills for driving my personal workflow (source [`plugins/workflow/`](plugins/workflow/)).
  Includes `/greet`, a hello-world skill that checks the plugin is installed. See the
  [plugin README](plugins/workflow/README.md).

## Installation

This repository is a [Claude Code plugin marketplace](https://docs.claude.com/en/docs/claude-code/plugins) named `ae-skills`.

Inside Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install workflow@ae-skills
```

The first command registers this GitHub repo as a marketplace; the second installs the plugin from it. You can also browse and install interactively with `/plugin`.

To update later, refresh the marketplace:

```
/plugin marketplace update ae-skills
```

To remove the plugin or the marketplace:

```
/plugin uninstall workflow@ae-skills
/plugin marketplace remove ae-skills
```

The marketplace manifest lives in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json); the plugin manifest in [`plugins/workflow/.claude-plugin/plugin.json`](plugins/workflow/.claude-plugin/plugin.json).
