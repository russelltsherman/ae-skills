---
agent: claude
operator: Russell Sherman
skills: none
---
# Spec: create the plugin foundation

## Requirements
- R1. `.claude-plugin/plugin.json` has exactly these keys and values: `name` `sdlc`; `version` `0.1.0`; `description` `an implementation of Anthropics AI Native Software Development Lifecycle`; `author` with `name` `Russell Sherman` and `url` `https://github.com/russelltsherman/ae-skills`; `keywords` `["skills"]`.
- R2. `../../.claude-plugin/marketplace.json` has exactly one entry in `plugins` whose `name` is `sdlc`. Its `source` is `./plugins/sdlc`, and its `description` is the same string as the manifest's `description`.
- R3. In the plugin directory, `claude plugin validate --strict .` and `claude plugin validate --profile directory .` both exit 0.
- R4. `README.md` starts with `# sdlc`. It says what the plugin does, how to install it from the `ae-skills` marketplace, and that it is in Phase 0 with no stage skills released yet. It names no skill or command the plugin does not ship, and it has enough words for `claude plugin validate --profile directory .` to report no `README_TRIVIAL` problem (operator decision, 2026-11-05).
- R5. The project `CLAUDE.md` is `.claude/CLAUDE.md`. There is no `CLAUDE.md` at the plugin root.
- R6. `.claude/CLAUDE.md` is at most 50 lines (operator decision, 2026-11-05). It has a `## Commands` section, and no `## Conventions` or `## Things to get right` section (operator decision, 2026-11-05).
- R7. `INTENT.md` and `ROADMAP.md` are at the plugin root. In `ROADMAP.md`, each `D<n>` and `F<n>` ID is defined exactly once, and the IDs of each letter run from 1 upward with no gaps.
- R8. `.specs/_rules/naming.md` defines change directories as `.specs/<feature>/<YYYYMMDD-HHMM>-<change>/`, slugs as lowercase kebab-case using `a-z`, `0-9` and `-`, and names starting with `_` as reserved for rules.
- R9. `.specs/_rules/` holds `intent_template.md`, `spec_template.md` and `plan_template.md`. Each one says that front matter is flat `key: value` lines with no `status` key, and that a document is approved when the operator asks for the next one and it exists. `plan_template.md` says the first implementation commit carries a `Plan-Approved-By: <operator>` trailer. The templates together say that `C`, `Q`, `R` and `K` IDs are never renumbered.
- R10. `.claude/CLAUDE.md` says that `.specs/_rules/` in this repo is the canonical copy that `init` ships to projects, and that changes to it are made under the feature `specs-rules`.
- R11. `.specs/intent-skill/`, `.specs/spec-skill/` and `.specs/plan-skill/` each hold a `<YYYYMMDD-HHMM>-create/intent.md`. Each one has the six front-matter keys in `intent_template.md`, a `# Intent: <title>` line, and the template's six `## ` headings in order.
- R12. `INTENT.md`, `ROADMAP.md`, `.specs/` and `refs/` are inside `plugins/sdlc/`.
- R13. `git ls-files refs` run in the plugin directory prints nothing.
- R14. The plugin ships no `skills/`, `agents/`, `commands/` or `hooks/` directory in this change.

## Design
The plugin is built from nothing, by hand, in `plugins/sdlc/` (R12, R14).

- **Manifest and marketplace entry (R1, R2).** A new `.claude-plugin/plugin.json` holds the R1 fields and nothing else. The shared `ae-skills` marketplace file gets one new `sdlc` entry, whose `description` is copied from the manifest so the two match.
- **README (R3, R4).** A new `README.md` gives `claude plugin validate --profile directory .` a usable listing description. The validator's `README_TRIVIAL` result decides whether it is long enough, not a local word count: the validator counts fewer words than `wc -w`.
- **Documents this change is planned from (R7–R9, R11).** `INTENT.md`, `ROADMAP.md`, `.specs/_rules/` and the intents for `intent`, `spec` and `plan` are written by hand before this change directory, because this change's own intent, spec and plan follow the templates and cite the roadmap's IDs. This change does not write them. It checks them against R7–R9 and R11.
  - `INTENT.md` states what the plugin is for. `ROADMAP.md` breaks the work into design decisions `D1`… and components `F1`…, with phases, and gives F1–F3 the one feature `plugin-foundation` (R7).
  - `.specs/_rules/naming.md` sets the change-directory layout (D1). The three templates set each document's front matter, sections and rules, including approval by asking for the next document, the `Plan-Approved-By:` trailer and permanent IDs (D2, D3) (R8, R9).
  - `.specs/intent-skill/`, `.specs/spec-skill/` and `.specs/plan-skill/` each hold one change directory named by `naming.md`, with an `intent.md` written from `intent_template.md` (R11).
- **Project `CLAUDE.md` (R5, R6, R10).** A new `.claude/CLAUDE.md`, not a root `CLAUDE.md` (D22), with the sections `Commands` and `Planning documents`, under 50 lines. It points to `INTENT.md`, `ROADMAP.md` and `.specs/_rules/`, and states that `.specs/_rules/` is the canonical copy `init` ships.
- **`refs/` (R13).** A new `refs/.gitignore` holding `*` keeps everything under `refs/` untracked, including the ignore file itself.
- **Hand-built (R14).** The change creates only a manifest, a marketplace entry, two Markdown files and an ignore file. It has no skill, agent, command or hook that could have built any of it.

## Out of scope / Deferred
- Deferred: the `ICON_MISSING` warning from `claude plugin validate --profile directory .`. It does not fail the command, and D6 leaves listing warnings until Phase 7.
- `PROMPT.md` and `TODO.md`. They are not part of the foundation, and this change does not create or track them (operator decision, 2026-11-05).
- `refs/.gitignore` stays a single `*` that also ignores itself, so the ignore rule is not committed (operator decision, 2026-11-05).
- Deferred: `make check`. It is F5, `.specs/check-target/`. Until it lands, R3 is checked by running the two validate commands.
- Deferred: the D21 checks (how a relative-path marketplace entry is pinned to a release tag, and how `--plugin-dir` interacts with an installed `sdlc`). They belong to the first release, at the end of Phase 0.
- Deferred: `init` copying `.specs/_rules/` into projects. That is F4. This change only makes this repo's copy the canonical one (C10).

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1. |
| C2 | R2. |
| C3 | R2. The marketplace `description` equals the manifest's. |
| C4 | R3, R4. The README is long enough for the `--profile directory` check. |
| C5 | R5. |
| C6 | R6. |
| C7 | R7. |
| C8 | R8. |
| C9 | R9. |
| C10 | R10. |
| C11 | R11. |
| C12 | R12. |
| C13 | R13. `refs/.gitignore` ignores everything under `refs/`. |
| C14 | R14. No plugin component exists to build with. |
| C15 | R1. `version` is `0.1.0`. |
| C16 | R1, R2. |
| C17 | R1. |
| C18 | R1. |

## Open questions from the intent
None.

## Areas of concern
None.
