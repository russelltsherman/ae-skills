---
status: "proposed"
date: 2026-11-10
components: [M5, M6]
contracts: [I5, I6]
decision-makers: [operator]
consulted: [agent]
informed: []
---

# 0007. Write scripts in Bash and jq, with the Python standard library only where needed

## Context and Problem Statement

The lint and the make targets need a scripting language. The choice decides what a machine must have installed to run `make check`.

## Decision Drivers

- SQT1. `make check` makes 0 model calls and needs no network.
- No install step beyond tools most machines already have.

## Considered Options

- Bash and `jq`, with the Python standard library where Bash gets unreadable (simplest workable)
- Python throughout
- Node throughout

## Decision Outcome

Chosen option: "Bash and `jq`, with the Python standard library where needed", because these are tools most machines already have, so there is no install step.

## Consequences

- Good, because `make check` runs on a fresh machine
- Bad, because the scripts may mix two languages

## Pros and Cons of the Options

### Bash and `jq`, with the Python standard library where Bash gets unreadable

- SQT1: 0 network calls, meets the target
- Good, because the tools are already on most machines, and shellcheck covers the Bash
- Bad, because parsing Markdown in Bash gets hard to read, which is why Python is allowed

### Python throughout

- SQT1: 0 network calls with the standard library only, meets the target
- Good, because parsing is readable
- Bad, because Python versions differ between machines

### Node throughout

- SQT1: meets the target only with no dependencies
- Bad, because Node is not on every machine
