# rnd

Research and development toolkit for Claude Code. Bundles authoring **skills** with two faithful
reproductions of built-in workflows, hardened with per-task retry so individual failed/empty agent
steps are retried before degrading gracefully:

- **`/ae-research`** — drive the resilient `research` deep-research workflow on a single topic, or
  over a whole topics file (`@file`), writing one cited Markdown report per topic. A reproduction of
  the built-in `deep-research` workflow + a `withRetry` wrapper. Pass `--ingest` to also push this
  run's complete reports into the OKF knowledge base via the `okf` skill (incomplete reports are
  skipped; requires the `okf` plugin).
- **`/ae-code-review`** — review the current diff for correctness bugs and
  reuse/simplification/efficiency cleanups at a chosen effort level (`low`/`medium` inline,
  `high`/`xhigh`/`max` via the `review` workflow). A reproduction of the built-in `code-review`
  command + the same `withRetry` resilience.
- **Skills** — `designing-architecture`, `writing-adr`, and `writing-prds` for structured design,
  ADR, and PRD authoring.

The two user-facing **commands** keep the `ae-` prefix so their short names stay unambiguous in the
palette (the built-ins are `deep-research` / `code-review`). The bundled **workflows** are invoked
by `scriptPath`, so their names are cosmetic and carry no prefix.

## Layout

```
rnd/
├── .claude-plugin/plugin.json
├── commands/
│   ├── ae-research.md           # /ae-research  (single topic or @topics-file)
│   └── ae-code-review.md        # /ae-code-review
├── workflows/
│   ├── research.js              # deep-research reproduction (+ withRetry)
│   ├── research-batch.js        # sequential per-topic driver (also backs single-topic runs)
│   ├── review.js                # code-review workflow reproduction (+ withRetry)
│   └── __tests__/               # unit tests for the pure helpers (node --test)
├── scripts/batch-research/      # parse/slug/render helpers (filesystem I/O lives here)
└── skills/
    ├── designing-architecture/
    ├── writing-adr/
    └── writing-prds/
```

Commands reference bundled files via `${CLAUDE_PLUGIN_ROOT}` (the plugin's install path), so they
work from any project. Research reports are written to `research/` in the **user's** current
project, not inside the plugin.

## Install

This repository (`ae-skills`) is a marketplace. Add it, then install the plugin:

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install rnd@ae-skills
```

## Tests

```bash
node --test plugins/rnd/workflows/__tests__/review.helpers.test.mjs
node --test plugins/rnd/workflows/__tests__/research.retry.test.mjs
node --test plugins/rnd/scripts/batch-research/lib.test.mjs
```

## Provenance

`research.js` and `review.js` are point-in-time reproductions extracted verbatim from the Claude
Code binary (`2.1.190`), each with an added `withRetry` wrapper. They will not track future changes
to the built-ins — re-extract from the binary to re-sync.
