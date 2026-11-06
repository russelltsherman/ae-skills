# CLAUDE.md

This directory is the `sdlc` Claude Code plugin, published in the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`). It is also the plugin's first project: it is built with its own process. The root intent is `INTENT.md`; the work breakdown, decisions (D-numbers) and components (F-numbers) are in `ROADMAP.md`.

## Commands

- Validate the plugin: `claude plugin validate --strict .` and `claude plugin validate --profile directory .` (both must exit 0). `make check` replaces these once F5 lands; after that, run `make check` before calling any change done.
- Try work in progress: `claude --plugin-dir .`. Never use an unreleased skill to write its own intent, spec or plan (INTENT.md C4).
- Tag a release: `claude plugin tag .` after bumping `version` in `.claude-plugin/plugin.json`.

## Planning documents

- Every change is planned in `.specs/<feature>/<YYYYMMDD-HHMM>-<change>/`. Before creating, finding or editing anything under `.specs/`, read the rule file for it: `.specs/_rules/naming.md`, `intent_template.md`, `spec_template.md`, `plan_template.md`.
- Never create the next document (spec, plan, code) unless the operator asks for it. Asking is the approval.
- Never settle an open question or concern with your own answer. Record only what the operator decided, marked `(operator decision, <YYYY-MM-DD>)` where the template says so.
- `.specs/_rules/` here is the canonical copy that `init` ships to projects (D3). Changes to it are changes under the feature `specs-rules`.
