// Unit tests for the per-task retry logic in ../research.js.
//
// The workflow file can't be imported directly: its body runs at module load and
// calls workflow-runtime globals (phase/agent/pipeline/...). Instead we extract the
// self-contained "retry helpers (testable)" block verbatim and evaluate it in
// isolation with an injected mock `log`. This tests the REAL source — no duplication.
//
// Run: node --test plugins/rnd/workflows/__tests__/research.retry.test.mjs

import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = readFileSync(join(__dirname, "..", "research.js"), "utf8")

const START = "// --- retry helpers (testable) "
const END = "// --- end retry helpers "
const startIdx = SRC.indexOf(START)
const endIdx = SRC.indexOf(END)
assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx,
  "could not locate the testable retry-helpers block markers in research.js")
const BLOCK = SRC.slice(startIdx, endIdx)

// Build a fresh sandbox per test so module-level `retriesUsed` resets between cases.
function loadHelpers() {
  const logs = []
  const factory = new Function(
    "log",
    BLOCK +
      "\nreturn { MAX_ATTEMPTS, withRetry, isEmptyScope, isEmptySearch, isEmptyExtract, isEmptyReport, never, getRetries: () => retriesUsed };"
  )
  const api = factory((msg) => logs.push(msg))
  return { ...api, logs }
}

// A thunk that yields a scripted sequence of values, one per call.
function sequence(values) {
  let i = 0
  const calls = []
  const thunk = async () => {
    const v = values[Math.min(i, values.length - 1)]
    i++
    calls.push(v)
    return v
  }
  return { thunk, calls: () => calls, count: () => i }
}

test("MAX_ATTEMPTS is 3 (1 try + 2 retries)", () => {
  const { MAX_ATTEMPTS } = loadHelpers()
  assert.equal(MAX_ATTEMPTS, 3)
})

test("returns first result when it is non-empty (no retry)", async () => {
  const h = loadHelpers()
  const good = { results: [{ url: "a" }] }
  const seq = sequence([good])
  const out = await h.withRetry(seq.thunk, { label: "search", isEmpty: h.isEmptySearch })
  assert.deepEqual(out, good)
  assert.equal(seq.count(), 1, "should call the thunk exactly once")
  assert.equal(h.getRetries(), 0)
})

test("retries on null then succeeds; counts one retry", async () => {
  const h = loadHelpers()
  const good = { findings: [{ claim: "x" }] }
  const seq = sequence([null, good])
  const out = await h.withRetry(seq.thunk, { label: "synthesize", isEmpty: h.isEmptyReport })
  assert.deepEqual(out, good)
  assert.equal(seq.count(), 2)
  assert.equal(h.getRetries(), 1)
})

test("retries on empty-but-valid then succeeds", async () => {
  const h = loadHelpers()
  const empty = { results: [] }
  const good = { results: [{ url: "a" }] }
  const seq = sequence([empty, good])
  const out = await h.withRetry(seq.thunk, { label: "search", isEmpty: h.isEmptySearch })
  assert.deepEqual(out, good)
  assert.equal(seq.count(), 2)
  assert.equal(h.getRetries(), 1)
})

test("stops at MAX_ATTEMPTS and returns the last (still-empty) value", async () => {
  const h = loadHelpers()
  const empty = { claims: [] }
  const seq = sequence([empty, empty, empty, empty])
  const out = await h.withRetry(seq.thunk, { label: "fetch", isEmpty: h.isEmptyExtract })
  assert.deepEqual(out, empty, "returns last value so caller's degrade path runs")
  assert.equal(seq.count(), 3, "exactly MAX_ATTEMPTS calls")
  assert.equal(h.getRetries(), 2, "two extra attempts beyond the first")
})

test("stops at MAX_ATTEMPTS and returns null when always null", async () => {
  const h = loadHelpers()
  const seq = sequence([null])
  const out = await h.withRetry(seq.thunk, { label: "scope", isEmpty: h.isEmptyScope })
  assert.equal(out, null)
  assert.equal(seq.count(), 3)
  assert.equal(h.getRetries(), 2)
})

test("never predicate: votes retry on null only, not on a valid verdict", async () => {
  const h = loadHelpers()
  const refute = { refuted: true, evidence: "e", confidence: "high" }
  // A valid verdict object is "non-empty" under `never`, so no retry.
  const seq = sequence([refute])
  const out = await h.withRetry(seq.thunk, { label: "v0", isEmpty: h.never })
  assert.deepEqual(out, refute)
  assert.equal(seq.count(), 1)
  assert.equal(h.getRetries(), 0)
})

test("never predicate still retries on null", async () => {
  const h = loadHelpers()
  const verdict = { refuted: false, evidence: "e", confidence: "low" }
  const seq = sequence([null, verdict])
  const out = await h.withRetry(seq.thunk, { label: "v1", isEmpty: h.never })
  assert.deepEqual(out, verdict)
  assert.equal(seq.count(), 2)
  assert.equal(h.getRetries(), 1)
})

test("retriesUsed accumulates across multiple withRetry calls in one run", async () => {
  const h = loadHelpers()
  await h.withRetry(sequence([null, { results: [1] }]).thunk, { label: "a", isEmpty: h.isEmptySearch }) // +1
  await h.withRetry(sequence([{ claims: [] }, { claims: [] }, { claims: [] }]).thunk, { label: "b", isEmpty: h.isEmptyExtract }) // +2
  assert.equal(h.getRetries(), 3)
})

test("emptiness predicates classify shapes correctly", () => {
  const h = loadHelpers()
  // scope
  assert.equal(h.isEmptyScope(null), true)
  assert.equal(h.isEmptyScope({ angles: [1, 2] }), true, "fewer than 3 angles is empty")
  assert.equal(h.isEmptyScope({ angles: [1, 2, 3] }), false)
  // search
  assert.equal(h.isEmptySearch({ results: [] }), true)
  assert.equal(h.isEmptySearch({ results: [{}] }), false)
  // extract
  assert.equal(h.isEmptyExtract({ claims: [] }), true)
  assert.equal(h.isEmptyExtract({ claims: [{}] }), false)
  assert.equal(h.isEmptyExtract({}), true, "missing claims array is empty")
  // report
  assert.equal(h.isEmptyReport({ findings: [] }), true)
  assert.equal(h.isEmptyReport({ findings: [{}] }), false)
  // never
  assert.equal(h.never({ anything: true }), false)
})

test("logs a retry line on each retry (no silent caps)", async () => {
  const h = loadHelpers()
  const seq = sequence([null, null, { results: [1] }])
  await h.withRetry(seq.thunk, { label: "search:demo", isEmpty: h.isEmptySearch })
  const retryLogs = h.logs.filter((l) => l.startsWith("retry "))
  assert.equal(retryLogs.length, 2)
  assert.match(retryLogs[0], /retry 1\/2 — search:demo returned null/)
})

// A thunk that yields a scripted mix of throws and values, one step per call.
function script(steps) {
  let i = 0
  const thunk = async () => {
    const step = steps[Math.min(i, steps.length - 1)]
    i++
    if (step && step.throwMsg) throw new Error(step.throwMsg)
    return step ? step.value : null
  }
  return { thunk, count: () => i }
}

test("retries on a thrown error then succeeds (the synthesis-throw case)", async () => {
  const h = loadHelpers()
  const good = { findings: [{ claim: "x" }] }
  const seq = script([{ throwMsg: "StructuredOutput retry cap (5) exceeded" }, { value: good }])
  const out = await h.withRetry(seq.thunk, { label: "synthesize", isEmpty: h.isEmptyReport })
  assert.deepEqual(out, good)
  assert.equal(seq.count(), 2)
  assert.equal(h.getRetries(), 1)
})

test("persistent throws return null after MAX_ATTEMPTS so the salvage path runs", async () => {
  const h = loadHelpers()
  const seq = script([{ throwMsg: "TelemetrySafeError: cap exceeded" }])
  const out = await h.withRetry(seq.thunk, { label: "synthesize", isEmpty: h.isEmptyReport })
  assert.equal(out, null, "null lets the caller's `if (!report)` salvage path run instead of crashing")
  assert.equal(seq.count(), 3, "exactly MAX_ATTEMPTS attempts")
  assert.equal(h.getRetries(), 2)
})

test("throws are logged with the error message and a retry line", async () => {
  const h = loadHelpers()
  const seq = script([{ throwMsg: "kaboom" }, { value: { results: [1] } }])
  await h.withRetry(seq.thunk, { label: "search:x", isEmpty: h.isEmptySearch })
  assert.ok(h.logs.some((l) => l.includes("threw: kaboom")), "logs the thrown error message")
  assert.ok(h.logs.some((l) => /retry 1\/2 — search:x threw/.test(l)), "logs a retry line for the throw")
})
