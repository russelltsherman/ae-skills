#!/usr/bin/env node
// Thin filesystem wrapper around lib.mjs — the ONLY place /ae-research touches
// disk. All logic lives in lib.mjs (pure, tested). Subcommands:
//
//   todo  <topics-file> <research-dir>
//       Parse the topics file, slug each topic, and print a JSON array of
//       [{topic, slug}] for topics that do NOT yet have research-dir/<slug>.md
//       (idempotent resume). Exits 2 if the topics file is missing.
//
//   write <results-json-file> <research-dir> <date>
//       Read a JSON array of {topic, slug, report, error} (what the batch
//       Workflow returns), render+write research-dir/<slug>.md for each (never
//       skipping a returned topic; incomplete reports are still written), then
//       regenerate research-dir/README.md from ALL reports on disk. Prints a
//       "done / failed" summary.
//
//   readme <research-dir>
//       Regenerate research-dir/README.md from the reports on disk.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { join, basename } from "node:path"
import {
  parseTopics,
  slug,
  renderReport,
  renderReadme,
  parseReportHeader,
  isIncomplete,
} from "./lib.mjs"

function die(msg, code = 1) {
  process.stderr.write(msg + "\n")
  process.exit(code)
}

// Rebuild the README index from every report file currently in research-dir.
function regenerateReadme(researchDir) {
  const files = readdirSync(researchDir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
  const entries = files.map((f) => {
    const md = readFileSync(join(researchDir, f), "utf8")
    const h = parseReportHeader(md)
    return {
      topic: h.topic || basename(f, ".md"),
      slug: basename(f, ".md"),
      date: h.date,
      incomplete: h.incomplete,
      note: h.note,
    }
  })
  writeFileSync(join(researchDir, "README.md"), renderReadme(entries))
  return entries.length
}

function cmdTodo(topicsFile, researchDir) {
  if (!topicsFile || !researchDir) die("usage: cli.mjs todo <topics-file> <research-dir>")
  if (!existsSync(topicsFile)) {
    die(
      `Topics file not found: ${topicsFile}\n` +
        "Expected one topic per line; blank lines ignored; lines starting with '#' are\n" +
        "comments; leading list markers (`- `, `* `, `1. `) are stripped. See topics.example.md.",
      2
    )
  }
  const topics = parseTopics(readFileSync(topicsFile, "utf8"))
  const todo = topics
    .map((topic) => ({ topic, slug: slug(topic) }))
    .filter(({ slug: s }) => !existsSync(join(researchDir, `${s}.md`)))
  process.stdout.write(JSON.stringify(todo, null, 2) + "\n")
}

function cmdWrite(resultsFile, researchDir, date) {
  if (!resultsFile || !researchDir || !date) {
    die("usage: cli.mjs write <results-json-file> <research-dir> <date>")
  }
  if (!existsSync(resultsFile)) die(`Results file not found: ${resultsFile}`, 2)
  mkdirSync(researchDir, { recursive: true })

  const results = JSON.parse(readFileSync(resultsFile, "utf8"))
  if (!Array.isArray(results)) die("Results JSON must be an array of {topic, slug, report, error}.")

  let done = 0
  let failed = 0
  for (const entry of results) {
    const s = entry.slug || slug(entry.topic)
    writeFileSync(join(researchDir, `${s}.md`), renderReport(entry, date))
    if (isIncomplete(entry)) failed++
    else done++
    process.stdout.write(`[write] ${entry.topic} → ${join(researchDir, `${s}.md`)}` +
      (isIncomplete(entry) ? " (incomplete)" : "") + "\n")
  }
  const total = regenerateReadme(researchDir)
  process.stdout.write(`\nWrote ${results.length} report(s): ${done} complete, ${failed} incomplete. ` +
    `README index now lists ${total}. Output dir: ${researchDir}\n`)
}

function cmdReadme(researchDir) {
  if (!researchDir) die("usage: cli.mjs readme <research-dir>")
  if (!existsSync(researchDir)) die(`Research dir not found: ${researchDir}`, 2)
  const total = regenerateReadme(researchDir)
  process.stdout.write(`README index regenerated with ${total} report(s).\n`)
}

const [cmd, ...rest] = process.argv.slice(2)
switch (cmd) {
  case "todo":
    cmdTodo(rest[0], rest[1])
    break
  case "write":
    cmdWrite(rest[0], rest[1], rest[2])
    break
  case "readme":
    cmdReadme(rest[0])
    break
  default:
    die("usage: cli.mjs <todo|write|readme> ...", 2)
}
