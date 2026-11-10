---
status: "proposed"
date: 2026-11-10
components: [M1, M2]
contracts: [I1, I2]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0006. Each project owns a copy of the templates in .blueprints/_rules/

## Context and Problem Statement

Every planning document follows a template. The skills could read the templates from the plugin, or from a copy in each project.

## Decision Drivers

- SC3. Planning documents are plain Markdown in the project's repository.
- Projects can adapt their templates.
- A plugin update does not change a project's document format without the operator knowing.

## Considered Options

- The project's own copy in `.blueprints/_rules/`, scaffolded by `init`
- Read from the plugin (simplest workable)

## Decision Outcome

Chosen option: "The project's own copy in `.blueprints/_rules/`", because projects can adapt their templates and a plugin update never changes them silently.

## Consequences

- Good, because the templates a document was written by sit beside it in the repository
- Bad, because template improvements reach a project only when `init` is re-run

## Pros and Cons of the Options

### The project's own copy in `.blueprints/_rules/`, scaffolded by `init`

- SC3: fits, because the templates sit in the repository beside the documents
- Good, because a project can adapt its templates
- Good, because a plugin update changes nothing until `init` is re-run and the operator agrees
- Bad, because the copies drift from the plugin's, and `init` must handle re-runs

### Read from the plugin

- SC3: fits
- Good, because there is nothing to copy and the templates are always current
- Bad, because a project cannot adapt them
- Bad, because a plugin update changes the format under existing documents
