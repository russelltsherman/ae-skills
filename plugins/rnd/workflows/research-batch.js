export const meta = {
  name: "research-batch",
  description: "Run the resilient research workflow over a to-do list of topics, sequentially, returning one structured report per topic. Never drops a topic — failures are captured, not skipped.",
  whenToUse: "Invoked by the /ae-research command after it has built a to-do list — either by parsing/filtering a topics file (batch mode) or as a one-element list for a single ad-hoc topic. Pass that list as args (a JSON array of {topic, slug} / bare topic strings). The command writes the returned reports to disk; this workflow only orchestrates the research.",
  phases: [
    { title: "Research", detail: "Run the research workflow once per topic, in order; capture every result" },
  ],
}

// args: either the to-do list directly (a JSON array of { topic, slug } / bare topic
// strings), or an object { topics, researchScriptPath } where researchScriptPath points
// at research.js (passed by the plugin command so the sibling workflow resolves by
// path rather than by a possibly plugin-namespaced bare name).
// Returns { results: [{ topic, slug, report, error }], stats }. `report` is whatever
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

// Resolve how to invoke the research workflow. Prefer an explicit scriptPath (plugin
// distribution, where a bare "research" is namespaced as "<plugin>:research"); fall back
// to the bare registered name for local/dev use.
let researchRef = "research"
let todo = parsed
if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
  if (parsed.researchScriptPath) researchRef = { scriptPath: parsed.researchScriptPath }
  todo = parsed.topics
}
todo = Array.isArray(todo) ? todo : []
if (todo.length === 0) {
  log("No topics to research (empty to-do list).")
  return { results: [], stats: { topics: 0, ok: 0, failed: 0 } }
}

const results = []
let ok = 0
let failed = 0

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

  results.push({ topic, slug, report, error })
}

log("Batch done: " + ok + " complete, " + failed + " incomplete, " + todo.length + " total")
return { results, stats: { topics: todo.length, ok, failed } }
