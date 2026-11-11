---
status: living
---

# Roadmap: blueprint

## Phase 1: Foundation

Everything the design skills stand on, built by hand: the plugin manifest, the templates, project scaffolding, and an offline `make check` that holds the plugin's own HLD to zero lint errors (SQT1, SQT2). It comes first because `hld` and `lld` read the templates `init` installs, and every later phase is checked by the lint.

- M1 templates: the eight document templates in the plugin's `.blueprints/_rules/`, stable enough for `init` to ship.
- M2 init: copying the templates into a project without overwriting changed files, the `CLAUDE.md` section between markers, and detection of a parent project. After: M1.
- M5 lint: front matter and status checks for every document type, heading checks, and citation checks within one project, including withdrawn items and superseded decisions.
- M6 make targets: `make check` running plugin validation, shellcheck, the lint and the lint's own tests; `make evals` as an empty, billed target kept out of `make check`. After: M5.

## Phase 2: High-level design

`hld` working on all four HLD document types, proven by maintaining this plugin's own `SYSTEM.md`, `ARCHITECTURE.md`, `ROADMAP.md` and decision records with it. From here, every later change to the plugin is planned in its own documents.

- M3 hld: review, interview and writing for the system intent, architecture, roadmap and decision records, including superseding an accepted decision, drawing on `pattern-*` skills for options and review.
- M6 make targets: eval cases for `hld`, including one where it is pushed to settle a decision itself and one where it must record an unsettled point instead of filling it in (SQT3). After: M3.

## Phase 3: Low-level design and linking

`lld` working on all four LLD document types, and the lint holding the two levels together. Needs the HLD skill from phase 2, since `lld` reads the HLD it writes.

- M4 lld: review, interview and writing for each component's intent, spec, proofs and plan, flagging boundary crossings and applying `policy-*` skills.
- M5 lint: cross-level citations, the check that every LLD directory names a component in `ARCHITECTURE.md`, nested-project `implements:` citations resolved in the parent's architecture, and agreement between decision records' `patterns:` and the Patterns section of `ARCHITECTURE.md`.
- M6 make targets: eval cases for `lld`, including a boundary crossing and an unsettled point it must record instead of filling in (SQT3). After: M4.

## Phase 4: Real project

One project outside the plugin carried from system intent to merged code before any public release. It needs every earlier phase, and it shows what the skills miss on a project they were not built alongside.

- M3 hld: changes found while writing the project's HLD.
- M4 lld: changes found while carrying the project's components from intent to plan.
