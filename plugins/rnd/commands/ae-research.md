---
description: Research one ad-hoc topic, or a whole topics file (@-prefixed), with the resilient research workflow — saving a cited Markdown report per topic.
argument-hint: "[topic | @topics-file]"
allowed-tools: Read, Write, Bash, Workflow
---

# Research

Drive the resilient `research` workflow and write one cited Markdown report per topic into
`research/`. Two modes, chosen by `$ARGUMENTS`:

- **Single** — a plain topic string (e.g. `test driven development`) → research that one topic.
- **Batch** — an `@`-prefixed file path (e.g. `@topics.md`) → research every topic in that file.
- **Default** — no argument → batch over `topics.md`.

This command is a **thin orchestrator**: all mechanical logic (parsing, slugging, rendering reports,
the README index, and idempotency) lives in a tested Node helper
(`${CLAUDE_PLUGIN_ROOT}/scripts/batch-research/`), and the per-topic iteration is a deterministic
Workflow (`${CLAUDE_PLUGIN_ROOT}/workflows/research-batch.js`). Your job is only to wire the steps
together. `${CLAUDE_PLUGIN_ROOT}` is substituted with this plugin's install path; the topics file and
the `research/` output directory are relative to the user's current project.

Single mode is just **batch-of-one**: both modes converge on the same workflow and the same writer,
differing only in how the to-do list is built (step 0).

## Procedure

Run these steps in order. Do not re-implement parsing, slugging, or report rendering in prose —
always call the helper.

### 0. Determine the mode and build the to-do list

Inspect `$ARGUMENTS`:

- **Empty** → batch mode, `TOPICS_FILE=topics.md`. Go to "batch to-do" below.
- **Starts with `@`** → batch mode. Strip the leading `@`; the remainder is `TOPICS_FILE`. Go to
  "batch to-do" below.
- **Anything else** → single mode. The to-do list is the inline one-element array
  `[{ "topic": "<$ARGUMENTS verbatim>" }]` (no idempotency — an explicit topic always re-runs and
  overwrites its report). Echo the single topic back to the user, then skip to step 1.

**Batch to-do (idempotent):** run the helper to parse the topics file and filter out topics that
already have a report:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/batch-research/cli.mjs" todo "<TOPICS_FILE>" research
```

- If the file is missing, the helper exits non-zero with the expected format and a pointer to
  `topics.example.md`. **Stop** and show that message to the user.
- The helper prints a JSON array of `{ topic, slug }` for not-yet-done topics.
- **Echo the to-do list and its count back to the user** (the parser check — do not skip it).
- If the array is empty, tell the user there is nothing to do (every topic already has a report)
  and stop.

### 1. Run the research workflow

First capture today's date — the workflow cannot call `Date`, so you must pass it in:

```bash
date +%F
```

Invoke the batch workflow by path, passing the step-0 to-do array as `topics`, the path to the
`research` workflow (so the batch resolves its sibling by path — bare workflow names may be
plugin-namespaced), and the **write context** (`cliPath`, `researchDir`, `date`) that lets the
workflow persist each report the moment its research finishes:

```
Workflow({
  scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/research-batch.js",
  args: {
    topics: <to-do array>,
    researchScriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/research.js",
    cliPath: "${CLAUDE_PLUGIN_ROOT}/scripts/batch-research/cli.mjs",
    researchDir: "research",
    date: "<output of `date +%F`>"
  }
})
```

Wait for it to finish. It runs `research` once per topic, sequentially, and **writes each
`research/<slug>.md` (and refreshes `research/README.md`) as soon as that topic completes** — so on a
long batch you can start reading finished reports immediately instead of waiting for the whole run.
It returns `{ results: [{ topic, slug, report, error }], stats: { topics, ok, failed, wrote } }`. It
never drops a topic — failed runs come back with `error` set and `report: null`. (Single mode is just
a one-topic batch.)

### 2. Backfill + refresh the index (safety net)

The reports are already on disk from step 1. This step is a deterministic backfill: it re-renders
every returned topic (covering any whose per-topic writer agent flaked) and regenerates the index, so
the final state is always produced by the tested helper.

- Save the workflow's `results` array (the JSON array itself) to a temporary file, e.g. write it
  with the Write tool to `/tmp/ae-research-results.json`.
- Hand it to the helper, which renders + writes every `research/<slug>.md` (incomplete reports
  included, marked as such) and regenerates `research/README.md`:

  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/scripts/batch-research/cli.mjs" write /tmp/ae-research-results.json research "$(date +%F)"
  ```

### 3. Finish

- Print a final summary from the workflow `stats` and the helper output: counts of complete vs
  incomplete reports, how many topics were already done (skipped in step 0, batch only), and the
  output directory (`research/`). For single mode this is just the one topic.

## Notes

- **Determinism:** topics are never silently dropped and reports are always written by tested code
  — both the per-topic `write-one` (step 1) and the end-of-batch `write` (step 2) go through the same
  helper, which writes a report file for every returned topic, including failures, so the README
  index can never list a report whose file is missing.
- **Incremental writes:** the workflow writes each `research/<slug>.md` the instant its topic's
  research finishes (via a writer agent calling `cli.mjs write-one`), so finished reports are
  readable while later topics are still running. Workflow scripts have no filesystem access, so the
  agent is the only available writer; if one writer agent fails, step 2 backfills that report.
- **Resume (batch):** step 0 skips topics that already have a `research/<slug>.md`, so re-running
  continues where a previous run left off. Because writes are now incremental, an interrupted batch
  keeps every report completed so far — re-run to resume at topic granularity.
- **Single mode does not skip:** naming a topic always re-runs it and overwrites
  `research/<slug>.md`.
- **The report format** (sections, the `_stats_` footer including `retriesUsed`, the incomplete
  marker) is defined and tested in `${CLAUDE_PLUGIN_ROOT}/scripts/batch-research/lib.mjs` — change
  it there, not here.
