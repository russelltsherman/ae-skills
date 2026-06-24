// Unit tests for the pure helpers in ../review.js (arg parsing, ranking, the
// synthesis assembler, and the per-task retry logic).
//
// The workflow file can't be imported directly: its body runs at module load and
// calls workflow-runtime globals (phase/agent/pipeline/...). Instead we extract the
// self-contained "testable helpers (pure)" block verbatim and evaluate it in
// isolation with an injected mock `log`. This tests the REAL source — no duplication.
//
// Run: node --test plugins/rnd/workflows/__tests__/review.helpers.test.mjs

import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = readFileSync(join(__dirname, "..", "review.js"), "utf8")

const START = "// --- testable helpers (pure) "
const END = "// --- end testable helpers "
const startIdx = SRC.indexOf(START)
const endIdx = SRC.indexOf(END)
assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx,
  "could not locate the testable helpers block markers in review.js")
const BLOCK = SRC.slice(startIdx, endIdx)

// Build a fresh sandbox per test so module-level `retriesUsed` resets between cases.
function loadHelpers() {
  const logs = []
  const factory = new Function(
    "log",
    BLOCK +
      "\nreturn { LEVEL_PARAMS, SWEEP_MAX, MAX_ATTEMPTS, parseArgs, rank, assemble, never, isEmptyReport, withRetry, getRetries: () => retriesUsed };"
  )
  const api = factory((msg) => logs.push(msg))
  return { ...api, logs }
}

// ─── parseArgs ───

test("parseArgs detects each valid level and strips it from the target", () => {
  const h = loadHelpers()
  for (const level of ["high", "xhigh", "max"]) {
    const out = h.parseArgs(level + " src/foo.ts")
    assert.equal(out.level, level)
    assert.equal(out.target, "src/foo.ts")
    assert.equal(out.params, h.LEVEL_PARAMS[level], "params is the LEVEL_PARAMS entry")
  }
})

test("parseArgs defaults to high when no level is given; whole string is the target", () => {
  const { parseArgs } = loadHelpers()
  const out = parseArgs("only review error handling")
  assert.equal(out.level, "high")
  assert.equal(out.target, "only review error handling")
})

test("parseArgs treats an unrecognized first word as part of the target, not a level", () => {
  const { parseArgs } = loadHelpers()
  const out = parseArgs("low review this") // low/medium are inline-only, not workflow levels
  assert.equal(out.level, "high")
  assert.equal(out.target, "low review this")
})

test("parseArgs ignores prototype keys as levels (hasOwnProperty guard)", () => {
  const { parseArgs } = loadHelpers()
  for (const evil of ["constructor", "toString", "hasOwnProperty"]) {
    const out = parseArgs(evil + " 123")
    assert.equal(out.level, "high", evil + " must not parse as a level")
    assert.equal(out.target, evil + " 123")
  }
})

test("parseArgs handles empty/non-string args", () => {
  const { parseArgs } = loadHelpers()
  assert.deepEqual(parseArgs("").level, "high")
  assert.equal(parseArgs("").target, "")
  assert.equal(parseArgs(undefined).level, "high")
  assert.equal(parseArgs("   high   ").level, "high")
  assert.equal(parseArgs("   high   ").target, "")
})

test("LEVEL_PARAMS: high has no sweep; xhigh/max sweep with wider fan-out", () => {
  const { LEVEL_PARAMS } = loadHelpers()
  assert.deepEqual(LEVEL_PARAMS.high, { correctnessAngles: 3, perAngle: 6, maxFindings: 10, sweep: false })
  assert.deepEqual(LEVEL_PARAMS.xhigh, { correctnessAngles: 5, perAngle: 8, maxFindings: 15, sweep: true })
  assert.deepEqual(LEVEL_PARAMS.max, { correctnessAngles: 5, perAngle: 8, maxFindings: 15, sweep: true })
})

// ─── rank ───

test("rank: correctness outranks cleanup; CONFIRMED outranks PLAUSIBLE", () => {
  const { rank } = loadHelpers()
  const cc = { kind: "correctness", verdict: "CONFIRMED" }
  const cp = { kind: "correctness", verdict: "PLAUSIBLE" }
  const lc = { kind: "cleanup", verdict: "CONFIRMED" }
  const lp = { kind: "cleanup", verdict: "PLAUSIBLE" }
  assert.ok(rank(cc) < rank(cp), "confirmed correctness before plausible correctness")
  assert.ok(rank(cp) < rank(lc), "any correctness before any cleanup")
  assert.ok(rank(lc) < rank(lp), "confirmed cleanup before plausible cleanup")
  // sorting a shuffled list yields the canonical order
  const sorted = [lp, cc, lc, cp].slice().sort((a, b) => rank(a) - rank(b))
  assert.deepEqual(sorted, [cc, cp, lc, lp])
})

// ─── assemble ───

const F = (file, line, verdict, kind = "correctness") =>
  ({ file, line, verdict, kind, summary: file + " summary", failure_scenario: file + " scenario" })

test("assemble: keeps the primary index and folds merges with a location note + verdict escalation", () => {
  const { assemble } = loadHelpers()
  const ranked = [F("a.ts", 1, "PLAUSIBLE"), F("b.ts", 2, "CONFIRMED"), F("c.ts", 3, "PLAUSIBLE")]
  const decisions = [{ index: 0, merge: [1] }, { index: 2 }]
  const { findings, usedDecisions, backfilled } = assemble(ranked, decisions, 10)
  assert.equal(usedDecisions, true)
  assert.equal(backfilled, 0)
  assert.equal(findings.length, 2)
  // primary 0 with merged 1 (CONFIRMED) → verdict escalates to CONFIRMED, note lists b.ts:2
  assert.equal(findings[0].verdict, "CONFIRMED")
  assert.match(findings[0].summary, /same root cause also at: b\.ts:2/)
  assert.equal(findings[1].file, "c.ts")
})

test("assemble: no index is claimed twice (merge cannot re-surface a primary)", () => {
  const { assemble } = loadHelpers()
  const ranked = [F("a.ts", 1, "CONFIRMED"), F("b.ts", 2, "PLAUSIBLE")]
  // decision tries to both keep index 1 AND merge it into 0 — the merge loses the race
  const decisions = [{ index: 0, merge: [1] }, { index: 1 }]
  const { findings } = assemble(ranked, decisions, 10)
  assert.equal(findings.length, 1, "index 1 already claimed by the merge, second decision drops")
  assert.match(findings[0].summary, /also at: b\.ts:2/)
})

test("assemble: backfills unclaimed verified findings when there is room", () => {
  const { assemble } = loadHelpers()
  const ranked = [F("a.ts", 1, "CONFIRMED"), F("b.ts", 2, "CONFIRMED"), F("c.ts", 3, "PLAUSIBLE")]
  const decisions = [{ index: 0 }] // synthesizer only mentioned one
  const { findings, usedDecisions, backfilled } = assemble(ranked, decisions, 10)
  assert.equal(usedDecisions, true)
  assert.equal(backfilled, 2, "b.ts and c.ts appended unmerged")
  assert.deepEqual(findings.map(f => f.file), ["a.ts", "b.ts", "c.ts"])
})

test("assemble: hard cap on maxFindings, dropping least-severe (decisions then backfill)", () => {
  const { assemble } = loadHelpers()
  const ranked = [F("a.ts", 1, "CONFIRMED"), F("b.ts", 2, "CONFIRMED"), F("c.ts", 3, "PLAUSIBLE")]
  const { findings } = assemble(ranked, [{ index: 0 }, { index: 1 }, { index: 2 }], 2)
  assert.equal(findings.length, 2)
  assert.deepEqual(findings.map(f => f.file), ["a.ts", "b.ts"])
})

test("assemble: cap is also enforced during backfill", () => {
  const { assemble } = loadHelpers()
  const ranked = [F("a.ts", 1, "CONFIRMED"), F("b.ts", 2, "CONFIRMED"), F("c.ts", 3, "PLAUSIBLE")]
  const { findings, backfilled } = assemble(ranked, [{ index: 0 }], 2)
  assert.equal(findings.length, 2)
  assert.equal(backfilled, 1, "only one backfill fits under the cap of 2")
})

test("assemble: empty/invalid decisions → all findings backfilled, usedDecisions false", () => {
  const { assemble } = loadHelpers()
  const ranked = [F("a.ts", 1, "CONFIRMED"), F("b.ts", 2, "PLAUSIBLE")]
  const { findings, usedDecisions, backfilled } = assemble(ranked, [], 10)
  assert.equal(usedDecisions, false)
  assert.equal(backfilled, 2)
  assert.equal(findings.length, 2)
  // null decisions are tolerated too
  assert.equal(assemble(ranked, null, 10).findings.length, 2)
})

test("assemble: out-of-range and duplicate indices are ignored", () => {
  const { assemble } = loadHelpers()
  const ranked = [F("a.ts", 1, "CONFIRMED")]
  const { findings } = assemble(ranked, [{ index: 5 }, { index: -1 }, { index: 0 }, { index: 0 }], 10)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].file, "a.ts")
})

test("assemble: omits line suffix when line is absent in the merge-location note", () => {
  const { assemble } = loadHelpers()
  const ranked = [F("a.ts", 1, "CONFIRMED"), F("b.ts", null, "CONFIRMED")]
  const { findings } = assemble(ranked, [{ index: 0, merge: [1] }], 10)
  assert.match(findings[0].summary, /also at: b\.ts\]/)
})

// ─── withRetry ───

function sequence(values) {
  let i = 0
  const thunk = async () => values[Math.min(i++, values.length - 1)]
  return { thunk, count: () => i }
}
function script(steps) {
  let i = 0
  const thunk = async () => {
    const step = steps[Math.min(i++, steps.length - 1)]
    if (step && step.throwMsg) throw new Error(step.throwMsg)
    return step ? step.value : null
  }
  return { thunk, count: () => i }
}

test("MAX_ATTEMPTS is 3 (1 try + 2 retries)", () => {
  assert.equal(loadHelpers().MAX_ATTEMPTS, 3)
})

test("withRetry returns the first non-null result under `never` (no retry)", async () => {
  const h = loadHelpers()
  const verdict = { verdict: "CONFIRMED", evidence: "e" }
  const seq = sequence([verdict])
  const out = await h.withRetry(seq.thunk, { label: "verify", isEmpty: h.never })
  assert.deepEqual(out, verdict)
  assert.equal(seq.count(), 1)
  assert.equal(h.getRetries(), 0)
})

test("withRetry retries on null then succeeds; counts one retry", async () => {
  const h = loadHelpers()
  const good = { decisions: [{ index: 0 }] }
  const seq = sequence([null, good])
  const out = await h.withRetry(seq.thunk, { label: "synthesize", isEmpty: h.isEmptyReport })
  assert.deepEqual(out, good)
  assert.equal(seq.count(), 2)
  assert.equal(h.getRetries(), 1)
})

test("withRetry retries on empty-but-valid report then succeeds", async () => {
  const h = loadHelpers()
  const empty = { summary: "x", decisions: [] }
  const good = { summary: "x", decisions: [{ index: 0 }] }
  const seq = sequence([empty, good])
  const out = await h.withRetry(seq.thunk, { label: "synthesize", isEmpty: h.isEmptyReport })
  assert.deepEqual(out, good)
  assert.equal(h.getRetries(), 1)
})

test("withRetry stops at MAX_ATTEMPTS and returns the last value", async () => {
  const h = loadHelpers()
  const empty = { decisions: [] }
  const seq = sequence([empty, empty, empty, empty])
  const out = await h.withRetry(seq.thunk, { label: "synthesize", isEmpty: h.isEmptyReport })
  assert.deepEqual(out, empty, "returns last value so caller's degrade path runs")
  assert.equal(seq.count(), 3)
  assert.equal(h.getRetries(), 2)
})

test("withRetry: never predicate retries on null only, not on a valid verdict", async () => {
  const h = loadHelpers()
  assert.equal(h.never({ anything: true }), false)
  const seq = sequence([null, { verdict: "REFUTED", evidence: "e" }])
  const out = await h.withRetry(seq.thunk, { label: "verify", isEmpty: h.never })
  assert.equal(out.verdict, "REFUTED")
  assert.equal(seq.count(), 2)
  assert.equal(h.getRetries(), 1)
})

test("withRetry retries on a thrown error then succeeds (the schema-throw case)", async () => {
  const h = loadHelpers()
  const good = { candidates: [] }
  const seq = script([{ throwMsg: "StructuredOutput retry cap (5) exceeded" }, { value: good }])
  const out = await h.withRetry(seq.thunk, { label: "find", isEmpty: h.never })
  assert.deepEqual(out, good)
  assert.equal(h.getRetries(), 1)
})

test("withRetry: persistent throws return null after MAX_ATTEMPTS so salvage runs", async () => {
  const h = loadHelpers()
  const seq = script([{ throwMsg: "TelemetrySafeError: cap exceeded" }])
  const out = await h.withRetry(seq.thunk, { label: "scope", isEmpty: h.never })
  assert.equal(out, null)
  assert.equal(seq.count(), 3)
  assert.equal(h.getRetries(), 2)
})

test("withRetry: retriesUsed accumulates across calls and logs each retry", async () => {
  const h = loadHelpers()
  await h.withRetry(sequence([null, { decisions: [{ index: 0 }] }]).thunk, { label: "a", isEmpty: h.isEmptyReport }) // +1
  await h.withRetry(script([{ throwMsg: "x" }, { throwMsg: "x" }, { value: { decisions: [{ index: 0 }] } }]).thunk, { label: "b", isEmpty: h.isEmptyReport }) // +2
  assert.equal(h.getRetries(), 3)
  assert.ok(h.logs.some(l => /retry 1\/2 — a returned null/.test(l)))
  assert.ok(h.logs.some(l => l.includes("threw: x")))
})

test("isEmptyReport classifies decision shapes", () => {
  const h = loadHelpers()
  assert.equal(h.isEmptyReport(null), true)
  assert.equal(h.isEmptyReport({ summary: "x" }), true, "missing decisions array")
  assert.equal(h.isEmptyReport({ decisions: [] }), true)
  assert.equal(h.isEmptyReport({ decisions: [{ index: 0 }] }), false)
})
