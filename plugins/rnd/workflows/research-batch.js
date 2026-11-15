export const meta = {
  name: "research-batch",
  description: "Run the resilient research workflow over a to-do list of topics, sequentially, returning one structured report per topic. Never drops a topic — failures are captured, not skipped.",
  whenToUse: "Invoked by the /ae-research command after it has built a to-do list — either by parsing/filtering a topics file (batch mode) or as a one-element list for a single ad-hoc topic. Pass that list as args (a JSON array of {topic, slug} / bare topic strings). The command writes the returned reports to disk; this workflow only orchestrates the research.",
  phases: [
    { title: "Research", detail: "Run the research workflow once per topic, in order; capture every result" },
    { title: "Write", detail: "Persist each report to disk the moment its research finishes (incremental, per-topic)" },
  ],
}

// args: either the to-do list directly (a JSON array of { topic, slug } / bare topic
// strings), or an object { topics, researchRef, researchScriptPath, cliPath, researchDir,
// date, tmpDir, maxTopics }.
//   - researchRef is the registered name of the research workflow (default "rnd:research",
//     the plugin-namespaced name). researchScriptPath is a dev-only alternative: the
//     Workflow runtime does not load scripts from a plugin's install path, so the plugin
//     command passes the name, not a path.
//   - researchDir must be ABSOLUTE. The writer agents resolve paths against the session's
//     starting directory, not the caller's, so a relative dir lands reports in the wrong
//     place. A relative researchDir disables incremental writes (the caller's end-of-batch
//     write still runs in the caller's own directory).
//   - maxTopics caps how many topics THIS run researches (default MAX_TOPICS_PER_RUN). A
//     child workflow() shares the parent's 1,000-agent lifetime cap and one research run
//     uses ~100+ agents, so a long batch must be split across runs. Topics past the cap
//     are returned untouched in `deferred` for the caller to run next.
//   - cliPath/researchDir/date enable INCREMENTAL writes: after each topic's research
//     finishes, a writer agent persists that one report to disk via `cli.mjs write-one`
//     (workflow scripts have no filesystem access, so an agent is the only writer). When
//     any of the three is absent, writing is skipped and the caller writes the returned
//     results at the end (the original whole-batch behavior).
//   - tmpDir is a scratch directory for the per-topic JSON handed to write-one (default /tmp).
//     date must be supplied by the caller — workflow scripts cannot call Date.
// Returns { results: [{ topic, slug, report, error }], deferred: [todo items], stats }. `report` is whatever
// the research workflow returned (it returns an object even on internal failure via its salvage
// paths); `error` captures a thrown failure. Either way the topic is never dropped.
phase("Research")

// The Workflow tool delivers `args` as a JSON STRING at the outer boundary, so
// parse it when needed. (Internal workflow(ref, topic) calls pass real JS values,
// so this normalization is only relevant to the top-level invocation.)
let parsed = args
if (typeof parsed === "string") {
  try { parsed = JSON.parse(parsed) } catch { parsed = [] }
}

// --- run split (testable) ------------------------------------------------------
// One research run spends ~100 agents (1 scope + ~6 search + 15 fetch + 25x3 verify +
// synthesis), more with retries. A nested workflow() shares this run's 1,000-agent
// lifetime cap, so ~9 topics exhaust it. 5 per run leaves headroom for retries.
const MAX_TOPICS_PER_RUN = 5

// Split a to-do list into the slice this run researches and the remainder it defers.
function splitRun(items, max) {
  const n = Number.isInteger(max) && max > 0 ? max : MAX_TOPICS_PER_RUN
  return { now: items.slice(0, n), deferred: items.slice(n) }
}
// --- end run split ---------------------------------------------------------------

// Resolve how to invoke the research workflow: by its plugin-namespaced registered
// name by default; an explicit researchScriptPath (dev use) or researchRef overrides.
let researchRef = "rnd:research"
let maxTopics = MAX_TOPICS_PER_RUN
let todo = parsed
let cliPath = null
let researchDir = null
let date = null
let tmpDir = "/tmp"
if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
  if (parsed.researchRef) researchRef = parsed.researchRef
  if (parsed.researchScriptPath) researchRef = { scriptPath: parsed.researchScriptPath }
  if (parsed.maxTopics) maxTopics = parsed.maxTopics
  if (parsed.cliPath) cliPath = parsed.cliPath
  if (parsed.researchDir) researchDir = parsed.researchDir
  if (parsed.date) date = parsed.date
  if (parsed.tmpDir) tmpDir = parsed.tmpDir
  todo = parsed.topics
}
todo = Array.isArray(todo) ? todo : []
if (todo.length === 0) {
  log("No topics to research (empty to-do list).")
  return { results: [], deferred: [], stats: { topics: 0, ok: 0, failed: 0, wrote: 0, deferred: 0 } }
}

const split = splitRun(todo, maxTopics)
const deferred = split.deferred
todo = split.now
if (deferred.length > 0) {
  log("Agent cap: researching " + todo.length + " topic(s) this run; deferring " +
    deferred.length + " to the next run.")
}

if (researchDir && !researchDir.startsWith("/")) {
  log("researchDir " + JSON.stringify(researchDir) + " is relative; skipping incremental " +
    "writes (pass an absolute path). The caller's end-of-batch write still persists reports.")
  researchDir = null
}

// Incremental writing is enabled only when the caller supplies the full write
// context. Otherwise we fall back to returning results for the caller to write.
const writeEnabled = !!(cliPath && researchDir && date)
const safeName = (s, n) => (s && /^[a-z0-9-]+$/.test(s) ? s : "topic-" + n)

const results = []
let ok = 0
let failed = 0
let wrote = 0

// Sequential by design: one research run fully completes before the next starts.
for (let i = 0; i < todo.length; i++) {
  const item = todo[i] || {}
  const topic = typeof item === "string" ? item : item.topic
  const slug = typeof item === "string" ? undefined : item.slug
  const n = i + 1

  log("[" + n + "/" + todo.length + "] " + topic)

  let report = null
  let error = null
  try {
    report = await workflow(researchRef, topic)
  } catch (e) {
    error = e && e.message ? e.message : String(e)
    log("[" + n + "/" + todo.length + "] " + topic + " — FAILED: " + error)
  }

  const noFindings = report && Array.isArray(report.findings) && report.findings.length === 0
  const incomplete = !report || !!error || !!noFindings || !!(report && report.error)
  if (incomplete) failed++
  else ok++

  const entry = { topic, slug, report, error }
  results.push(entry)

  // Persist THIS report now, so a large batch can be read as it progresses
  // instead of all-at-the-end. The writer agent is the only thing here with
  // filesystem access; it writes the entry JSON verbatim then renders it via the
  // tested CLI. A write failure is logged but never drops the topic — the caller's
  // end-of-batch write backfills any report a writer agent missed.
  if (writeEnabled) {
    phase("Write")
    const entryJson = JSON.stringify(entry) // single line — no newlines/fences to corrupt
    const jsonPath = tmpDir.replace(/\/$/, "") + "/ae-research-" + safeName(slug, n) + ".json"
    const writerPrompt =
      "You are a deterministic file writer. Perform EXACTLY these two steps and nothing else " +
      "(do not research, summarize, reformat, or alter any content):\n\n" +
      "1. Use the Write tool to write the following EXACT single-line JSON (verbatim, byte-for-byte) to:\n" +
      "   " + jsonPath + "\n\n" +
      "JSON to write:\n" + entryJson + "\n\n" +
      "2. Use the Bash tool to run, exactly:\n" +
      "   node " + JSON.stringify(cliPath) + " write-one " + JSON.stringify(jsonPath) + " " +
      JSON.stringify(researchDir) + " " + JSON.stringify(date) + "\n\n" +
      "Then report that command's stdout."
    try {
      await agent(writerPrompt, { label: "write:" + String(topic).slice(0, 40), phase: "Write" })
      wrote++
      log("[" + n + "/" + todo.length + "] wrote " + (slug || topic))
    } catch (e) {
      log("[" + n + "/" + todo.length + "] write FAILED for " + topic + ": " + (e && e.message ? e.message : String(e)))
    }
    phase("Research")
  }
}

log("Batch done: " + ok + " complete, " + failed + " incomplete, " + todo.length + " total" +
  (writeEnabled ? " (" + wrote + " written incrementally)" : "") +
  (deferred.length ? "; " + deferred.length + " deferred to the next run" : ""))
return { results, deferred, stats: { topics: todo.length, ok, failed, wrote, deferred: deferred.length } }
